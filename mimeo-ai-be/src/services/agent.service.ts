import * as agentRepo from '../repositories/agent.repository.js';
import { getAiProvider } from './ai/ai-provider.factory.js';
import { BadRequestError } from '../utils/api-error.js';
import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/index.js';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '../types/agent.types.js';

function validateModel(aiProvider: 'claude' | 'openai', aiModel: string): void {
  const provider = getAiProvider(aiProvider);
  const supported = provider.listModels();
  if (!supported.includes(aiModel)) {
    throw new BadRequestError(
      `Model "${aiModel}" is not supported for provider "${aiProvider}". Supported: ${supported.join(', ')}`
    );
  }
}

export async function listAgents(workspaceId: string, userId: string): Promise<Agent[]> {
  return agentRepo.findAllByWorkspaceId(workspaceId, userId);
}

export async function getAgent(agentId: string, userId: string): Promise<Agent> {
  return agentRepo.findById(agentId, userId);
}

export async function createAgent(workspaceId: string, dto: CreateAgentDto, userId: string): Promise<Agent> {
  validateModel(dto.ai_provider, dto.ai_model);
  return agentRepo.create(workspaceId, dto, userId);
}

export async function updateAgent(agentId: string, dto: UpdateAgentDto, userId: string): Promise<Agent> {
  if (dto.ai_provider && dto.ai_model) {
    validateModel(dto.ai_provider, dto.ai_model);
  }
  return agentRepo.update(agentId, dto, userId);
}

export async function duplicateAgent(agentId: string, workspaceId: string, userId: string): Promise<Agent> {
  const source = await agentRepo.findById(agentId, userId);
  const dto: CreateAgentDto = {
    name: `${source.name} (copia)`,
    tone: source.tone,
    tone_of_voice_id: source.tone_of_voice_id,
    target_audience: source.target_audience || undefined,
    writing_style_guidelines: source.writing_style_guidelines || undefined,
    custom_system_prompt: source.custom_system_prompt || undefined,
    ai_provider: source.ai_provider,
    ai_model: source.ai_model,
    platform_type: source.platform_type,
    versions_count: source.versions_count,
    schedule_brief: source.schedule_brief || undefined,
    sources: source.sources?.length ? source.sources : undefined,
    image_generation_enabled: source.image_generation_enabled,
    image_prompt: source.image_prompt || undefined,
    image_count: source.image_count,
    image_reference_url: source.image_reference_url,
  };
  return agentRepo.create(workspaceId, dto, userId);
}

export async function deleteAgent(agentId: string, userId: string): Promise<void> {
  return agentRepo.remove(agentId, userId);
}

export async function uploadSourceFile(
  base64File: string,
  fileName: string,
  userId: string
): Promise<{ url: string; extracted_text: string }> {
  const raw = base64File.replace(/^data:[^;]+;base64,/, '');
  const buffer = Buffer.from(raw, 'base64');

  const ext = (fileName.split('.').pop() || 'bin').toLowerCase();
  const storageName = `${userId}/${randomUUID()}.${ext}`;

  const contentTypeMap: Record<string, string> = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    md: 'text/markdown',
    csv: 'text/csv',
    json: 'application/json',
  };
  const contentType = contentTypeMap[ext] || 'application/octet-stream';

  const { error: uploadError } = await supabaseAdmin.storage
    .from('agent-sources')
    .upload(storageName, buffer, { contentType, upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseAdmin.storage
    .from('agent-sources')
    .getPublicUrl(storageName);

  // Extract text content from the file
  let extractedText = '';
  if (ext === 'pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    await parser.load();
    const result = await parser.getText();
    extractedText = result.text;
  } else {
    extractedText = buffer.toString('utf-8');
  }

  // Limit text to avoid oversized JSONB payloads
  extractedText = extractedText
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim()
    .slice(0, 10000);

  return { url: urlData.publicUrl, extracted_text: extractedText };
}

export async function uploadAndAnalyzeReferenceImage(
  base64Image: string,
  userId: string
): Promise<{ url: string; style_description: string }> {
  // Strip data URI prefix if present
  const raw = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(raw, 'base64');

  // Upload to Supabase Storage
  const fileName = `${userId}/${randomUUID()}.png`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('agent-references')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseAdmin.storage
    .from('agent-references')
    .getPublicUrl(fileName);

  // Analyze style with GPT-4o Vision
  const openai = new OpenAI({ apiKey: config.ai.openaiApiKey });
  const analysis = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze the visual style of this image in detail. Describe: color palette, composition style, mood/atmosphere, graphic style (illustration, photo, flat design, 3D, etc.), typography style if present, and any distinctive visual elements. Write a concise prompt-ready description that can be used to generate images in the same style. Reply ONLY with the style description, no preamble.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${raw}` },
          },
        ],
      },
    ],
  });

  const styleDescription = analysis.choices[0]?.message?.content || '';

  return { url: urlData.publicUrl, style_description: styleDescription };
}
