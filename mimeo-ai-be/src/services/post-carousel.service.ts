import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import * as postRepo from '../repositories/post.repository.js';
import * as agentRepo from '../repositories/agent.repository.js';
import * as carouselRepo from '../repositories/post-carousel.repository.js';
import { getAiProvider } from './ai/ai-provider.factory.js';
import { BadRequestError } from '../utils/api-error.js';
import type { PostCarousel } from '../types/post-carousel.types.js';

const CAROUSEL_SYSTEM_PROMPT = `You are a carousel slide designer for social media. You generate self-contained HTML documents that represent carousel slides.

RULES:
- Generate a single HTML document with multiple slides.
- Each slide is a <div class="slide"> exactly 1080x1080 pixels.
- Use ONLY inline CSS within a <style> tag in the <head>. No external resources.
- Use clean, modern design: bold headings, concise text, good whitespace.
- Use a cohesive color scheme across all slides.
- The first slide should be a title/hook slide that grabs attention.
- The last slide should be a call-to-action or summary slide.
- Middle slides break down the key points of the content.
- Keep text per slide minimal (max 40-50 words per slide). Use large fonts.
- Use CSS page-break-after: always between slides for PDF pagination.
- Do NOT use images, SVGs, or external fonts. Use system fonts only.
- Use CSS shapes, gradients, borders, and background colors for visual interest.
- Output ONLY the HTML document, nothing else. No explanation, no markdown fences.

HTML STRUCTURE:
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .slide { width: 1080px; height: 1080px; padding: 80px; display: flex; flex-direction: column; justify-content: center; page-break-after: always; overflow: hidden; }
  .slide:last-child { page-break-after: auto; }
  /* ... your styles ... */
</style>
</head>
<body>
  <div class="slide">...</div>
  <div class="slide">...</div>
  ...
</body>
</html>`;

export async function generateCarousel(
  postId: string,
  userId: string,
  customPrompt?: string
): Promise<PostCarousel> {
  const post = await postRepo.findById(postId, userId);
  const agent = await agentRepo.findById(post.agent_id, userId);

  const aiProvider = getAiProvider(agent.ai_provider);

  const userPromptParts = [
    `Create a carousel of slides that summarizes and presents the following content in a visually engaging way.\n\nPost content:\n${post.content.slice(0, 4000)}`,
  ];

  if (agent.carousel_prompt) {
    userPromptParts.push(`\nAdditional style/design instructions:\n${agent.carousel_prompt}`);
  }
  if (customPrompt) {
    userPromptParts.push(`\nUser instructions for this generation:\n${customPrompt}`);
  }
  if (post.title) {
    userPromptParts.push(`\nPost title (use it for the first slide): ${post.title}`);
  }

  const start = Date.now();
  const aiResponse = await aiProvider.generate({
    systemPrompt: CAROUSEL_SYSTEM_PROMPT,
    userPrompt: userPromptParts.join('\n'),
    model: agent.ai_model,
    maxTokens: 8192,
    temperature: 0.7,
  });

  // Extract HTML from response (strip markdown fences if present)
  let html = aiResponse.content.trim();
  if (html.startsWith('```')) {
    html = html.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '');
  }

  // Count slides
  const slidesCount = (html.match(/<div\s+class=["']slide["']/g) || []).length;

  // Convert HTML to PDF using Puppeteer + @sparticuz/chromium
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      width: '1080px',
      height: '1080px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    const generationTimeMs = Date.now() - start;

    // Upload PDF to Supabase Storage
    const fileName = `${userId}/${postId}/${randomUUID()}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('post-carousels')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabaseAdmin.storage
      .from('post-carousels')
      .getPublicUrl(fileName);

    return carouselRepo.create({
      post_id: postId,
      user_id: userId,
      storage_path: fileName,
      public_url: urlData.publicUrl,
      slides_count: slidesCount || 1,
      ai_model: aiResponse.model,
      generation_time_ms: generationTimeMs,
    });
  } finally {
    await browser.close();
  }
}

export async function getPostCarousels(postId: string, userId: string): Promise<PostCarousel[]> {
  await postRepo.findById(postId, userId);
  return carouselRepo.findByPostId(postId, userId);
}

export async function regenerateCarousel(
  postId: string,
  userId: string,
  feedback?: string
): Promise<PostCarousel> {
  const post = await postRepo.findById(postId, userId);
  const agent = await agentRepo.findById(post.agent_id, userId);

  if (!agent.carousel_enabled) {
    throw new BadRequestError('Carousel generation is not enabled for this agent');
  }

  return generateCarousel(postId, userId, feedback);
}

export async function deleteCarousel(carouselId: string, userId: string): Promise<void> {
  const carousels = await supabaseAdmin
    .from('mimeo_post_carousels')
    .select('storage_path')
    .eq('id', carouselId)
    .eq('user_id', userId)
    .single();

  if (carousels.data) {
    await supabaseAdmin.storage
      .from('post-carousels')
      .remove([carousels.data.storage_path]);
  }

  await carouselRepo.remove(carouselId, userId);
}
