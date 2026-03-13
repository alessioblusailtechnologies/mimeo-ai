import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, AiGenerationRequest, AiGenerationResponse } from './ai-provider.interface.js';

export class ClaudeProvider implements AiProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(request: AiGenerationRequest): Promise<AiGenerationResponse> {
    const start = Date.now();

    const response = await this.client.messages.create({
      model: request.model,
      max_tokens: request.maxTokens || 1024,
      temperature: request.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.userPrompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    const content = textBlock ? textBlock.text : '';

    return {
      content,
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      model: response.model,
      provider: 'claude',
      generationTimeMs: Date.now() - start,
    };
  }

  listModels(): string[] {
    return ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'];
  }
}
