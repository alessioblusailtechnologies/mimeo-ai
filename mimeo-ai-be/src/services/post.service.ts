import * as agentRepo from '../repositories/agent.repository.js';
import * as postRepo from '../repositories/post.repository.js';
import * as generationRepo from '../repositories/generation.repository.js';
import * as tovRepo from '../repositories/tone-of-voice.repository.js';
import { getAiProvider } from './ai/ai-provider.factory.js';
import * as postImageService from './post-image.service.js';
import * as linkedInRepo from '../repositories/linkedin.repository.js';
import { ManualCopyPublisher } from './publishing/manual-copy.publisher.js';
import { LinkedInPublisher } from './publishing/linkedin.publisher.js';
import { buildSystemPrompt, buildUserPrompt, buildImagePrompt } from '../utils/prompt-builder.js';
import { extractUrls, scrapeUrls, formatScrapedForPrompt, webSearch, formatSearchResultsForPrompt } from '../utils/scraper.js';
import { BadRequestError, NotFoundError } from '../utils/api-error.js';
import type { Post, PostStatus, GenerateDraftDto, UpdatePostDto } from '../types/post.types.js';
import type { Generation } from '../types/generation.types.js';
import type { Agent } from '../types/agent.types.js';
import type { Publisher } from './publishing/publisher.interface.js';

async function getPublisher(workspaceId: string, userId: string): Promise<Publisher> {
  const connection = await linkedInRepo.findByWorkspaceId(workspaceId, userId);
  if (connection && connection.linkedin_organization_id !== '__pending__') {
    return new LinkedInPublisher(workspaceId, userId);
  }
  return new ManualCopyPublisher();
}

async function fetchToneOfVoice(agent: Agent, userId: string) {
  if (!agent.tone_of_voice_id) return null;
  try {
    return await tovRepo.findById(agent.tone_of_voice_id, userId);
  } catch {
    return null;
  }
}

// Keywords that indicate the brief wants current/real-time information
const SEARCH_KEYWORDS = /\b(ultime notizie|notizie recenti|attualit[àa]|news|trending|latest|recent|current|oggi|questa settimana|questo mese|aggiornament[io]|novit[àa]|tendenz[ae]|trend)\b/i;

async function enrichBriefWithReferences(brief: string, referenceUrls?: string[], agentSourceUrls?: string[]): Promise<string> {
  const parts: string[] = [];

  // 1. Scrape explicit URLs from brief text, reference_urls param, and agent source URLs
  const briefUrls = extractUrls(brief);
  const allUrls = [...new Set([...briefUrls, ...(referenceUrls || []), ...(agentSourceUrls || [])])];

  if (allUrls.length > 0) {
    const scraped = await scrapeUrls(allUrls);
    const formatted = formatScrapedForPrompt(scraped);
    if (formatted) parts.push(formatted);
  }

  // 2. If the brief asks for current/latest info, do a web search
  if (SEARCH_KEYWORDS.test(brief)) {
    // Extract the core topic by removing common filler words
    const searchQuery = brief
      .replace(/https?:\/\/[^\s]+/g, '') // remove URLs
      .slice(0, 150); // limit length
    const searchResults = await webSearch(searchQuery, 3);
    const formatted = formatSearchResultsForPrompt(searchResults);
    if (formatted) {
      parts.push(`\n\nThe following are real-time web search results relevant to the brief:\n\n${formatted}`);
    }
  }

  return parts.join('');
}

function extractAgentSourceUrls(agent: Agent): string[] {
  if (!agent.sources || agent.sources.length === 0) return [];
  return agent.sources
    .filter(s => s.type === 'url')
    .map(s => s.value);
}

export async function generateDraft(
  workspaceId: string,
  dto: GenerateDraftDto,
  userId: string
): Promise<{ post: Post; generations: Generation[] }> {
  const agent = await agentRepo.findById(dto.agent_id, userId);
  const tov = await fetchToneOfVoice(agent, userId);

  const systemPrompt = buildSystemPrompt(agent, tov);

  // Scrape any URLs found in the brief, reference_urls, or agent sources
  const agentSourceUrls = extractAgentSourceUrls(agent);
  const referenceContent = await enrichBriefWithReferences(dto.brief, dto.reference_urls, agentSourceUrls);
  const userPrompt = buildUserPrompt(dto.brief, referenceContent || undefined, agent.platform_type);

  const aiProvider = getAiProvider(agent.ai_provider);
  const versionsCount = Math.min(Math.max(agent.versions_count || 1, 1), 3);

  // Generate N versions in parallel
  const aiResponses = await Promise.all(
    Array.from({ length: versionsCount }, (_, i) =>
      aiProvider.generate({
        systemPrompt,
        userPrompt,
        model: agent.ai_model,
        temperature: versionsCount > 1 ? 0.7 + i * 0.1 : undefined,
      })
    )
  );

  // Create post with the first version's content
  const post = await postRepo.create({
    user_id: userId,
    workspace_id: workspaceId,
    agent_id: agent.id,
    title: dto.title,
    content: aiResponses[0].content,
    original_brief: dto.brief,
  });

  // Create generation records — first one is selected
  const generations = await Promise.all(
    aiResponses.map((aiResponse, i) =>
      generationRepo.create({
        post_id: post.id,
        user_id: userId,
        agent_id: agent.id,
        content: aiResponse.content,
        ai_provider: aiResponse.provider,
        ai_model: aiResponse.model,
        prompt_tokens: aiResponse.promptTokens,
        completion_tokens: aiResponse.completionTokens,
        generation_time_ms: aiResponse.generationTimeMs,
        is_selected: i === 0,
      })
    )
  );

  // Auto-generate images if agent has image generation enabled
  if (agent.image_generation_enabled && agent.image_prompt) {
    const imagePrompt = buildImagePrompt(agent.image_prompt, aiResponses[0].content, dto.brief);
    postImageService.generateImages(post.id, userId, imagePrompt, agent.image_count || 1)
      .catch(err => console.error('Auto image generation failed:', err));
  }

  return { post, generations };
}

export async function regenerate(
  postId: string,
  userId: string,
  userFeedback?: string
): Promise<{ post: Post; generation: Generation }> {
  const post = await postRepo.findById(postId, userId);
  const agent = await agentRepo.findById(post.agent_id, userId);
  const tov = await fetchToneOfVoice(agent, userId);

  const systemPrompt = buildSystemPrompt(agent, tov);

  // Scrape any URLs found in the original brief + agent sources
  const agentSourceUrls = extractAgentSourceUrls(agent);
  const referenceContent = await enrichBriefWithReferences(post.original_brief, undefined, agentSourceUrls);
  const userPrompt = buildUserPrompt(post.original_brief, referenceContent || undefined, agent.platform_type, userFeedback);

  const aiProvider = getAiProvider(agent.ai_provider);
  const aiResponse = await aiProvider.generate({
    systemPrompt,
    userPrompt,
    model: agent.ai_model,
    temperature: 0.9,
  });

  const generation = await generationRepo.create({
    post_id: post.id,
    user_id: userId,
    agent_id: agent.id,
    content: aiResponse.content,
    ai_provider: aiResponse.provider,
    ai_model: aiResponse.model,
    prompt_tokens: aiResponse.promptTokens,
    completion_tokens: aiResponse.completionTokens,
    generation_time_ms: aiResponse.generationTimeMs,
    is_selected: false,
  });

  // Auto-generate images if agent has image generation enabled
  if (agent.image_generation_enabled && agent.image_prompt) {
    const imagePrompt = buildImagePrompt(agent.image_prompt, aiResponse.content, post.original_brief);
    postImageService.generateImages(post.id, userId, imagePrompt, agent.image_count || 1)
      .catch(err => console.error('Auto image regeneration failed:', err));
  }

  return { post, generation };
}

export async function selectGeneration(
  postId: string,
  generationId: string,
  userId: string
): Promise<Post> {
  const generations = await generationRepo.findByPostId(postId, userId);
  const target = generations.find(g => g.id === generationId);
  if (!target) throw new NotFoundError('Generation not found');

  await generationRepo.markSelected(generationId, postId, userId);
  return postRepo.update(postId, { content: target.content }, userId);
}

export async function listDrafts(
  workspaceId: string,
  userId: string,
  filters?: { status?: PostStatus }
): Promise<Post[]> {
  return postRepo.findAllByWorkspaceId(workspaceId, userId, filters);
}

export async function getDraft(postId: string, userId: string): Promise<Post> {
  return postRepo.findById(postId, userId);
}

export async function getGenerations(postId: string, userId: string): Promise<Generation[]> {
  await postRepo.findById(postId, userId); // verify ownership
  return generationRepo.findByPostId(postId, userId);
}

export async function updateDraft(
  postId: string,
  dto: UpdatePostDto,
  userId: string
): Promise<Post> {
  return postRepo.update(postId, dto, userId);
}

export async function approveDraft(postId: string, userId: string): Promise<Post> {
  const post = await postRepo.findById(postId, userId);
  if (post.status !== 'draft') {
    throw new BadRequestError(`Cannot approve a post with status "${post.status}"`);
  }
  return postRepo.updateStatus(postId, 'approved', userId);
}

export async function publishPost(postId: string, userId: string): Promise<Post> {
  const post = await postRepo.findById(postId, userId);
  if (post.status !== 'approved') {
    throw new BadRequestError(`Cannot publish a post with status "${post.status}". Approve it first.`);
  }

  const publisher = await getPublisher(post.workspace_id, userId);
  const result = await publisher.publish(post);
  if (!result.success) {
    throw new BadRequestError(result.error || 'Publishing failed');
  }

  return postRepo.updateStatus(postId, 'published', userId, {
    published_at: result.publishedAt,
  });
}
