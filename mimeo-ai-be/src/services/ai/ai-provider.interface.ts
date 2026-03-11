export interface AiGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AiGenerationResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  provider: 'claude' | 'openai';
  generationTimeMs: number;
}

export interface AiProvider {
  generate(request: AiGenerationRequest): Promise<AiGenerationResponse>;
  listModels(): string[];
}
