export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface ChatAction {
  agent_name: string;
  tone: string;
  target_audience?: string;
  writing_style_guidelines?: string;
  schedule_brief?: string;
  briefs: string[];
  ai_provider: 'claude' | 'openai';
  ai_model: string;
}

export interface ChatResponse {
  message: string;
  done: boolean;
  results?: {
    agent: { id: string; name: string };
    posts: { id: string; title: string | null; content: string; status: string }[];
  };
}
