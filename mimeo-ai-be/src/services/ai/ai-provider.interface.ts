export interface AiGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  imageUrls?: string[];
}

export interface AiGenerationResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  provider: 'claude' | 'openai';
  generationTimeMs: number;
}

export interface AiImageRequest {
  prompt: string;
  n?: number;
  size?: '1024x1024' | '1536x1024' | '1024x1536';
  quality?: 'low' | 'medium' | 'high';
}

export interface AiImageResponse {
  images: Buffer[];
  model: string;
  provider: 'openai';
  generationTimeMs: number;
}

export interface AiProvider {
  generate(request: AiGenerationRequest): Promise<AiGenerationResponse>;
  listModels(): string[];
}

export interface AiImageProvider {
  generateImages(request: AiImageRequest): Promise<AiImageResponse>;
}
