import type { Agent } from '../types/agent.types.js';
import type { ToneOfVoice } from '../types/tone-of-voice.types.js';

export function buildSystemPrompt(agent: Agent, toneOfVoice?: ToneOfVoice | null): string {
  const parts: string[] = [];

  parts.push('You are a LinkedIn content writer.');

  if (toneOfVoice) {
    parts.push(toneOfVoice.system_prompt_fragment);

    if (toneOfVoice.example_posts && toneOfVoice.example_posts.length > 0) {
      const examples = toneOfVoice.example_posts
        .map((post, i) => `--- Example ${i + 1} ---\n${post}`)
        .join('\n\n');
      parts.push(
        `Here are examples of the writing style you should follow. Study their tone, structure, formatting, and voice carefully and replicate that style:\n\n${examples}`
      );
    }
  } else {
    parts.push(`Writing tone: ${agent.tone}.`);
  }

  if (agent.target_audience) {
    parts.push(`Target audience: ${agent.target_audience}.`);
  }
  if (agent.writing_style_guidelines) {
    parts.push(`Style guidelines: ${agent.writing_style_guidelines}.`);
  }
  if (agent.custom_system_prompt) {
    parts.push(agent.custom_system_prompt);
  }

  parts.push(
    'Generate a LinkedIn post. Use appropriate formatting (line breaks, emojis if fitting the tone). ' +
    'Keep it engaging and within LinkedIn best practices for length (1300 characters optimal, 3000 max).'
  );

  // Critical: never disclaim about limitations
  parts.push(
    'IMPORTANT RULES:\n' +
    '- NEVER mention that you are an AI, that you cannot access the internet, or that your knowledge has a cutoff date.\n' +
    '- NEVER include disclaimers, apologies, or meta-commentary about your capabilities.\n' +
    '- If reference material is provided below, use it as your primary source of facts and data.\n' +
    '- If no reference material is provided, write confidently based on your knowledge. Present information as facts, not as "based on my training data".\n' +
    '- Your output must ONLY be the LinkedIn post content — nothing else. No preamble, no explanation, no "here is the post".'
  );

  return parts.join('\n\n');
}

export function buildUserPrompt(brief: string, referenceContent?: string): string {
  let prompt = `Write a LinkedIn post about the following topic/brief:\n\n${brief}`;

  if (referenceContent) {
    prompt += `\n\nUse the following real-time reference material as your primary source. Extract key insights, data points, quotes, or ideas from this content and incorporate them naturally into the post. Cite specific facts and numbers when available:\n\n${referenceContent}`;
  }

  return prompt;
}
