import * as workspaceRepo from '../repositories/workspace.repository.js';
import type { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '../types/workspace.types.js';

export async function listWorkspaces(userId: string): Promise<Workspace[]> {
  return workspaceRepo.findAllByUserId(userId);
}

export async function getWorkspace(wsId: string, userId: string): Promise<Workspace> {
  return workspaceRepo.findById(wsId, userId);
}

export async function createWorkspace(dto: CreateWorkspaceDto, userId: string): Promise<Workspace> {
  return workspaceRepo.create(dto, userId);
}

export async function updateWorkspace(wsId: string, dto: UpdateWorkspaceDto, userId: string): Promise<Workspace> {
  return workspaceRepo.update(wsId, dto, userId);
}

export async function deleteWorkspace(wsId: string, userId: string): Promise<void> {
  return workspaceRepo.remove(wsId, userId);
}
