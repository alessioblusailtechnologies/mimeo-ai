import OpenAI from 'openai';
import type { AiProvider, AiImageProvider, AiGenerationRequest, AiGenerationResponse, AiImageRequest, AiImageResponse } from './ai-provider.interface.js';

export class OpenAIProvider implements AiProvider, AiImageProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(request: AiGenerationRequest): Promise<AiGenerationResponse> {
    const start = Date.now();

    const response = await this.client.chat.completions.create({
      model: request.model,
      max_tokens: request.maxTokens || 1024,
      temperature: request.temperature ?? 0.7,
      messages: [
        { role: 'system', content: request.systemPrompt },
        { role: 'user', content: request.userPrompt },
      ],
    });

    return {
      content: response.choices[0]?.message?.content || '',
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      model: response.model,
      provider: 'openai',
      generationTimeMs: Date.now() - start,
    };
  }

  async generateImages(request: AiImageRequest): Promise<AiImageResponse> {
    const start = Date.now();
    const n = Math.min(Math.max(request.n || 1, 1), 4);

    const response = await this.client.images.generate({
      model: 'gpt-image-1.5',
      prompt: request.prompt,
      n,
      size: request.size || '1024x1024',
      quality: request.quality || 'medium',
    });

    const buffers = await Promise.all(
      (response.data ?? []).map(async (img) => {
        if (img.b64_json) {
          return Buffer.from(img.b64_json, 'base64');
        }
        // Fallback: fetch from URL if returned as URL
        const res = await fetch(img.url!);
        return Buffer.from(await res.arrayBuffer());
      })
    );

    return {
      images: buffers,
      model: 'gpt-image-1.5',
      provider: 'openai',
      generationTimeMs: Date.now() - start,
    };
  }

  listModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini'];
  }
}
