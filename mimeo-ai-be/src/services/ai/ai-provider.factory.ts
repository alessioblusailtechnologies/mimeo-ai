import { config } from '../../config/index.js';
import { BadRequestError } from '../../utils/api-error.js';
import type { AiProvider } from './ai-provider.interface.js';
import { ClaudeProvider } from './claude.provider.js';
import { OpenAIProvider } from './openai.provider.js';

export function getAiProvider(provider: 'claude' | 'openai'): AiProvider {
  switch (provider) {
    case 'claude':
      return new ClaudeProvider(config.ai.anthropicApiKey);
    case 'openai':
      return new OpenAIProvider(config.ai.openaiApiKey);
    default:
      throw new BadRequestError(`Unsupported AI provider: ${provider}`);
  }
}
