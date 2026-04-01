import puppeteer from 'puppeteer';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import * as postRepo from '../repositories/post.repository.js';
import * as agentRepo from '../repositories/agent.repository.js';
import * as carouselRepo from '../repositories/post-carousel.repository.js';
import { getAiProvider } from './ai/ai-provider.factory.js';
import { BadRequestError } from '../utils/api-error.js';
import type { PostCarousel } from '../types/post-carousel.types.js';

const SLIDE_SIZE = 1080;

const CAROUSEL_SYSTEM_PROMPT = `You are an expert carousel designer for LinkedIn and social media.

Your task is to generate a COMPLETE, self-contained HTML document that renders a series of carousel slides.

OUTPUT: You MUST output ONLY valid HTML. No markdown, no explanation, no code fences.

TECHNICAL REQUIREMENTS:
- Each slide is a <section class="slide"> element, exactly ${SLIDE_SIZE}px × ${SLIDE_SIZE}px.
- All CSS must be in a <style> tag inside <head>. No external stylesheets or scripts.
- You may use Google Fonts via @import in the <style> tag.
- The body must have margin: 0 and display slides vertically one after another.
- Add this print CSS for PDF pagination:
  @media print {
    .slide { page-break-after: always; }
    .slide:last-child { page-break-after: auto; }
  }

DESIGN RULES:
- Generate 5-8 slides depending on content depth.
- First slide: eye-catching title/hook that grabs attention. Use the post title if provided.
- Last slide: strong call-to-action or key takeaway summary.
- Middle slides: one key point per slide. Keep text concise and impactful.
- Use a cohesive, modern color scheme. Dark backgrounds with light text work best for LinkedIn.
- Use accent colors for titles, decorative elements, and highlights.
- Add decorative elements: geometric shapes, accent bars/lines, subtle gradients.
- Include slide numbers at the bottom (e.g. "3/7").
- Use proper visual hierarchy: large bold titles, medium body text, small footnotes.
- Ensure text is readable and well-spaced. Don't overcrowd slides.

HTML TEMPLATE TO FOLLOW:
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { margin: 0; }
    .slide {
      width: ${SLIDE_SIZE}px;
      height: ${SLIDE_SIZE}px;
      padding: 80px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }
    @media print {
      .slide { page-break-after: always; }
      .slide:last-child { page-break-after: auto; }
    }
    /* Your custom styles here */
  </style>
</head>
<body>
  <section class="slide"><!-- slide content --></section>
  <!-- more slides -->
</body>
</html>`;

async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: SLIDE_SIZE, height: SLIDE_SIZE });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15_000 });

    const pdf = await page.pdf({
      width: `${SLIDE_SIZE}px`,
      height: `${SLIDE_SIZE}px`,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function countSlides(html: string): number {
  const matches = html.match(/<section[^>]*class\s*=\s*["'][^"']*slide[^"']*["']/g);
  return matches ? matches.length : 0;
}

function extractHtml(raw: string): string {
  let html = raw.trim();
  // Strip code fences if the LLM wrapped the output
  if (html.startsWith('```')) {
    html = html.replace(/^```(?:html)?\n?/, '').replace(/\n?```$/, '');
  }
  return html;
}

export async function generateCarousel(
  postId: string,
  userId: string,
  customPrompt?: string
): Promise<PostCarousel> {
  const post = await postRepo.findById(postId, userId);
  const agent = await agentRepo.findById(post.agent_id, userId);

  const aiProvider = getAiProvider(agent.ai_provider);

  const userPromptParts = [
    `Create carousel slides that present the following content in a visually stunning way.\n\nPost content:\n${post.content.slice(0, 4000)}`,
  ];

  if (agent.carousel_prompt) {
    userPromptParts.push(`\nAdditional style/design instructions:\n${agent.carousel_prompt}`);
  }
  if (customPrompt) {
    userPromptParts.push(`\nUser instructions:\n${customPrompt}`);
  }
  if (post.title) {
    userPromptParts.push(`\nPost title (use for the first slide): ${post.title}`);
  }

  const start = Date.now();
  const aiResponse = await aiProvider.generate({
    systemPrompt: CAROUSEL_SYSTEM_PROMPT,
    userPrompt: userPromptParts.join('\n'),
    model: agent.ai_model,
    maxTokens: 8192,
    temperature: 0.7,
  });

  const html = extractHtml(aiResponse.content);

  const slidesCount = countSlides(html);
  if (slidesCount === 0) {
    throw new BadRequestError('AI did not return valid carousel HTML with slides');
  }

  // Convert HTML → PDF
  const pdfBytes = await htmlToPdf(html);
  const generationTimeMs = Date.now() - start;

  // Upload HTML and PDF to Supabase Storage in parallel
  const fileId = randomUUID();
  const htmlPath = `${userId}/${postId}/${fileId}.html`;
  const pdfPath = `${userId}/${postId}/${fileId}.pdf`;

  const [htmlUpload, pdfUpload] = await Promise.all([
    supabaseAdmin.storage.from('post-carousels').upload(htmlPath, html, {
      contentType: 'text/html',
      upsert: false,
    }),
    supabaseAdmin.storage.from('post-carousels').upload(pdfPath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: false,
    }),
  ]);

  if (htmlUpload.error) throw htmlUpload.error;
  if (pdfUpload.error) throw pdfUpload.error;

  const { data: urlData } = supabaseAdmin.storage
    .from('post-carousels')
    .getPublicUrl(pdfPath);

  return carouselRepo.create({
    post_id: postId,
    user_id: userId,
    storage_path: pdfPath,
    public_url: urlData.publicUrl,
    slides_count: slidesCount,
    ai_model: aiResponse.model,
    generation_time_ms: generationTimeMs,
  });
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
    const pdfPath = carousels.data.storage_path;
    const htmlPath = pdfPath.replace(/\.pdf$/, '.html');
    await supabaseAdmin.storage
      .from('post-carousels')
      .remove([pdfPath, htmlPath]);
  }

  await carouselRepo.remove(carouselId, userId);
}
