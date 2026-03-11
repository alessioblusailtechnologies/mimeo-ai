import OpenAI from 'openai';
import type { AiProvider, AiGenerationRequest, AiGenerationResponse } from './ai-provider.interface.js';

export class OpenAIProvider implements AiProvider {
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

  listModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini'];
  }
}
