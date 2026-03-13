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

  return parts.join('\n\n');
}

export function buildUserPrompt(brief: string): string {
  return `Write a LinkedIn post about the following topic/brief:\n\n${brief}`;
}
