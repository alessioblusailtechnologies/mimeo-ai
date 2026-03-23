import * as agentRepo from '../repositories/agent.repository.js';
import { getAiProvider } from './ai/ai-provider.factory.js';
import { BadRequestError } from '../utils/api-error.js';
import { supabaseAdmin } from '../config/supabase.js';
import { config } from '../config/index.js';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import type { Agent, CreateAgentDto, UpdateAgentDto } from '../types/agent.types.js';

function validateModel(aiProvider: 'claude' | 'openai', aiModel: string): void {
  const provider = getAiProvider(aiProvider);
  const supported = provider.listModels();
  if (!supported.includes(aiModel)) {
    throw new BadRequestError(
      `Model "${aiModel}" is not supported for provider "${aiProvider}". Supported: ${supported.join(', ')}`
    );
  }
}

export async function listAgents(workspaceId: string, userId: string): Promise<Agent[]> {
  return agentRepo.findAllByWorkspaceId(workspaceId, userId);
}

export async function getAgent(agentId: string, userId: string): Promise<Agent> {
  return agentRepo.findById(agentId, userId);
}

export async function createAgent(workspaceId: string, dto: CreateAgentDto, userId: string): Promise<Agent> {
  validateModel(dto.ai_provider, dto.ai_model);
  return agentRepo.create(workspaceId, dto, userId);
}

export async function updateAgent(agentId: string, dto: UpdateAgentDto, userId: string): Promise<Agent> {
  if (dto.ai_provider && dto.ai_model) {
    validateModel(dto.ai_provider, dto.ai_model);
  }
  return agentRepo.update(agentId, dto, userId);
}

export async function deleteAgent(agentId: string, userId: string): Promise<void> {
  return agentRepo.remove(agentId, userId);
}

export async function uploadAndAnalyzeReferenceImage(
  base64Image: string,
  userId: string
): Promise<{ url: string; style_description: string }> {
  // Strip data URI prefix if present
  const raw = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(raw, 'base64');

  // Upload to Supabase Storage
  const fileName = `${userId}/${randomUUID()}.png`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('agent-references')
    .upload(fileName, buffer, { contentType: 'image/png', upsert: false });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabaseAdmin.storage
    .from('agent-references')
    .getPublicUrl(fileName);

  // Analyze style with GPT-4o Vision
  const openai = new OpenAI({ apiKey: config.ai.openaiApiKey });
  const analysis = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze the visual style of this image in detail. Describe: color palette, composition style, mood/atmosphere, graphic style (illustration, photo, flat design, 3D, etc.), typography style if present, and any distinctive visual elements. Write a concise prompt-ready description that can be used to generate images in the same style. Reply ONLY with the style description, no preamble.',
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/png;base64,${raw}` },
          },
        ],
      },
    ],
  });

  const styleDescription = analysis.choices[0]?.message?.content || '';

  return { url: urlData.publicUrl, style_description: styleDescription };
}
