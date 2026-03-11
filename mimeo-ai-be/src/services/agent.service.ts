import * as agentRepo from '../repositories/agent.repository.js';
import { getAiProvider } from './ai/ai-provider.factory.js';
import { BadRequestError } from '../utils/api-error.js';
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
