import type { Agent } from '../types/agent.types.js';

export function buildSystemPrompt(agent: Agent): string {
  const parts: string[] = [];

  parts.push('You are a LinkedIn content writer.');
  parts.push(`Writing tone: ${agent.tone}.`);

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
