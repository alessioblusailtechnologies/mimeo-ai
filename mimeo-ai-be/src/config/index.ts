export interface Config {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  ai: {
    anthropicApiKey: string;
    openaiApiKey: string;
    tavilyApiKey: string;
  };
  cors: {
    origin: string;
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  supabase: {
    url: requireEnv('SUPABASE_URL'),
    anonKey: requireEnv('SUPABASE_ANON_KEY'),
    serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
  ai: {
    anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
    openaiApiKey: requireEnv('OPENAI_API_KEY'),
    tavilyApiKey: requireEnv('TAVILY_API_KEY'),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  },
};
