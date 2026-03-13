import * as tovRepo from '../repositories/tone-of-voice.repository.js';
import type { ToneOfVoice, CreateToneOfVoiceDto, UpdateToneOfVoiceDto } from '../types/tone-of-voice.types.js';

export async function listToneOfVoices(workspaceId: string, userId: string): Promise<ToneOfVoice[]> {
  return tovRepo.findAllByWorkspaceId(workspaceId, userId);
}

export async function getToneOfVoice(id: string, userId: string): Promise<ToneOfVoice> {
  return tovRepo.findById(id, userId);
}

export async function createToneOfVoice(workspaceId: string, dto: CreateToneOfVoiceDto, userId: string): Promise<ToneOfVoice> {
  return tovRepo.create(workspaceId, dto, userId);
}

export async function updateToneOfVoice(id: string, dto: UpdateToneOfVoiceDto, userId: string): Promise<ToneOfVoice> {
  return tovRepo.update(id, dto, userId);
}

export async function deleteToneOfVoice(id: string, userId: string): Promise<void> {
  return tovRepo.remove(id, userId);
}
