import type { Agent } from '../types/agent.types.js';
import type { ToneOfVoice } from '../types/tone-of-voice.types.js';

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  blog: 'Blog',
  generic: 'social media',
};

export function buildSystemPrompt(agent: Agent, toneOfVoice?: ToneOfVoice | null): string {
  const parts: string[] = [];
  const platformLabel = PLATFORM_LABELS[agent.platform_type] || PLATFORM_LABELS.linkedin;

  parts.push(`You are a ${platformLabel} content writer.`);

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

  const platformInstructions: Record<string, string> = {
    linkedin: 'Generate a LinkedIn post. Keep it engaging and within LinkedIn best practices for length (1300 characters optimal, 3000 max).\n' +
      'FORMATTING RULES FOR LINKEDIN:\n' +
      '- Use short paragraphs separated by blank lines for readability.\n' +
      '- For lists, use "•" (bullet point) or numbered lists ("1.", "2.") — NEVER use "–" or "—" as list markers.\n' +
      '- Do NOT use markdown syntax (no #, **, _, ```, etc.) — LinkedIn does not render markdown.\n' +
      '- Use line breaks generously to create visual breathing room.\n' +
      '- Emojis are allowed if they fit the tone, but use them sparingly.\n' +
      '- Do NOT use horizontal rules, dividers, or separator lines.',
    blog: 'Generate a blog post. Use markdown formatting: headings (##, ###), bold (**text**), bullet lists (- item), and paragraphs for readability. Aim for 500-1500 words depending on the topic depth.',
    generic: 'Generate a social media post. Use appropriate formatting for the platform. Keep it engaging and well-structured. For lists use "•" bullet points, not dashes.',
  };

  parts.push(platformInstructions[agent.platform_type] || platformInstructions.linkedin);

  // Critical: never disclaim about limitations
  parts.push(
    'IMPORTANT RULES:\n' +
    '- NEVER mention that you are an AI, that you cannot access the internet, or that your knowledge has a cutoff date.\n' +
    '- NEVER include disclaimers, apologies, or meta-commentary about your capabilities.\n' +
    '- If reference material is provided below, use it as your primary source of facts and data.\n' +
    '- If no reference material is provided, write confidently based on your knowledge. Present information as facts, not as "based on my training data".\n' +
    '- Your output must ONLY be the post content — nothing else. No preamble, no explanation, no "here is the post".'
  );

  return parts.join('\n\n');
}

export function buildImagePrompt(
  agentImagePrompt: string,
  postContent: string,
  brief: string,
  userFeedback?: string
): string {
  const parts: string[] = [];

  parts.push(agentImagePrompt);
  parts.push(`\nThe image should be contextually relevant to the following post content:\n\n${postContent.slice(0, 1500)}`);
  parts.push(`\nThe post topic is: ${brief.slice(0, 500)}`);

  if (userFeedback) {
    parts.push(`\nAdditional instructions for this image regeneration: ${userFeedback}`);
  }

  return parts.join('\n');
}

export function buildUserPrompt(brief: string, referenceContent?: string, platformType?: string, userFeedback?: string): string {
  const platformLabel = PLATFORM_LABELS[platformType || 'linkedin'] || PLATFORM_LABELS.linkedin;
  let prompt = `Write a ${platformLabel} post about the following topic/brief:\n\n${brief}`;

  if (referenceContent) {
    prompt += `\n\nUse the following real-time reference material as your primary source. Extract key insights, data points, quotes, or ideas from this content and incorporate them naturally into the post. Cite specific facts and numbers when available:\n\n${referenceContent}`;
  }

  if (userFeedback) {
    prompt += `\n\nAdditional instructions from the user for this regeneration. Follow these closely to adjust the output:\n${userFeedback}`;
  }

  return prompt;
}
