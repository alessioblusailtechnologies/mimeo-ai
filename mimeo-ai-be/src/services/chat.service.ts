import * as agentRepo from '../repositories/agent.repository.js';
import * as postService from './post.service.js';
import { getAiProvider } from './ai/ai-provider.factory.js';
import type { ChatMessage, ChatRequest, ChatAction, ChatResponse } from '../types/chat.types.js';
import type { AgentTone } from '../types/agent.types.js';

const CHAT_SYSTEM_PROMPT = `You are Mimeo AI, an intelligent assistant for creating LinkedIn content. You help users create posts by understanding their needs through natural conversation.

Your job:
1. Understand what the user wants to create
2. Ask follow-up questions if needed (tone, audience, number of posts, specific angles)
3. When you have enough information, include a JSON action block

Always respond in Italian. Be concise, friendly, and helpful. Use a natural conversational tone.

When asking questions, suggest options. For example:
- Tone: professionale, creativo, tecnico, casual, ispirazionale, educativo
- Suggest specific angles for the posts

When you have enough information, end your response with a JSON block like this:
\`\`\`json
{
  "ready": true,
  "agent_name": "descriptive name for this content creator",
  "tone": "professional",
  "target_audience": "who the posts are for",
  "schedule_brief": "general topic description for future content generation by this agent",
  "briefs": ["detailed brief for post 1", "detailed brief for post 2"],
  "ai_provider": "openai",
  "ai_model": "gpt-4o"
}
\`\`\`

Important rules:
- Each brief in the array should be detailed and specific enough to generate a great LinkedIn post
- schedule_brief is a general summary of the agent's purpose/topic area, used for future content generation
- Default to openai/gpt-4o unless the user specifies otherwise
- Default tone is "professional" unless specified
- Always ask at least 1-2 clarifying questions before generating, unless the user's request is extremely detailed
- The JSON block must be valid JSON wrapped in \`\`\`json \`\`\` markers`;

const CHAT_MODEL = 'gpt-4o';

function buildConversationPrompt(history: ChatMessage[], message: string): string {
  const parts: string[] = [];

  for (const msg of history) {
    if (msg.role === 'user') {
      parts.push(`User: ${msg.content}`);
    } else {
      parts.push(`Assistant: ${msg.content}`);
    }
  }

  parts.push(`User: ${message}`);

  return parts.join('\n\n');
}

function extractJsonAction(text: string): { action: ChatAction | null; cleanMessage: string } {
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/;
  const match = text.match(jsonBlockRegex);

  if (!match) {
    return { action: null, cleanMessage: text.trim() };
  }

  try {
    const parsed = JSON.parse(match[1].trim());

    if (!parsed.ready) {
      return { action: null, cleanMessage: text.trim() };
    }

    const action: ChatAction = {
      agent_name: parsed.agent_name,
      tone: parsed.tone || 'professional',
      target_audience: parsed.target_audience,
      writing_style_guidelines: parsed.writing_style_guidelines,
      schedule_brief: parsed.schedule_brief,
      briefs: parsed.briefs,
      ai_provider: parsed.ai_provider || 'openai',
      ai_model: parsed.ai_model || CHAT_MODEL,
    };

    const cleanMessage = text.replace(jsonBlockRegex, '').trim();

    return { action, cleanMessage };
  } catch {
    return { action: null, cleanMessage: text.trim() };
  }
}

export async function processMessage(
  workspaceId: string,
  request: ChatRequest,
  userId: string
): Promise<ChatResponse> {
  const aiProvider = getAiProvider('openai');

  const userPrompt = buildConversationPrompt(request.history, request.message);

  const aiResponse = await aiProvider.generate({
    systemPrompt: CHAT_SYSTEM_PROMPT,
    userPrompt,
    model: CHAT_MODEL,
    maxTokens: 2048,
  });

  const { action, cleanMessage } = extractJsonAction(aiResponse.content);

  if (!action) {
    return {
      message: cleanMessage,
      done: false,
    };
  }

  // Create agent
  const agent = await agentRepo.create(
    workspaceId,
    {
      name: action.agent_name,
      tone: action.tone as AgentTone,
      target_audience: action.target_audience,
      writing_style_guidelines: action.writing_style_guidelines,
      ai_provider: action.ai_provider,
      ai_model: action.ai_model,
      schedule_brief: action.schedule_brief || action.briefs[0],
    },
    userId
  );

  // Generate posts for each brief
  const posts: { id: string; title: string | null; content: string; status: string }[] = [];

  for (const brief of action.briefs) {
    const { post } = await postService.generateDraft(
      workspaceId,
      {
        agent_id: agent.id,
        brief,
      },
      userId
    );

    posts.push({
      id: post.id,
      title: post.title,
      content: post.content,
      status: post.status,
    });
  }

  return {
    message: cleanMessage,
    done: true,
    results: {
      agent: { id: agent.id, name: agent.name },
      posts,
    },
  };
}
