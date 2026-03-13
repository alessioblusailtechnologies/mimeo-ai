import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

export interface Agent {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  tone: string;
  tone_of_voice_id: string | null;
  target_audience: string | null;
  writing_style_guidelines: string | null;
  custom_system_prompt: string | null;
  ai_provider: 'claude' | 'openai';
  ai_model: string;
  is_active: boolean;
  schedule_enabled: boolean;
  schedule_cron: string | null;
  schedule_brief: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentDto {
  name: string;
  tone: string;
  tone_of_voice_id?: string;
  target_audience?: string;
  writing_style_guidelines?: string;
  custom_system_prompt?: string;
  ai_provider: 'claude' | 'openai';
  ai_model: string;
  schedule_enabled?: boolean;
  schedule_cron?: string;
  schedule_brief?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  constructor(private http: HttpClient) {}

  private url(wsId: string) {
    return `${environment.apiUrl}/workspaces/${wsId}/agents`;
  }

  list(wsId: string) {
    return this.http.get<ApiResponse<Agent[]>>(this.url(wsId)).pipe(map(r => r.data));
  }

  getById(wsId: string, id: string) {
    return this.http.get<ApiResponse<Agent>>(`${this.url(wsId)}/${id}`).pipe(map(r => r.data));
  }

  create(wsId: string, dto: CreateAgentDto) {
    return this.http.post<ApiResponse<Agent>>(this.url(wsId), dto).pipe(map(r => r.data));
  }

  update(wsId: string, id: string, dto: Partial<CreateAgentDto>) {
    return this.http.patch<ApiResponse<Agent>>(`${this.url(wsId)}/${id}`, dto).pipe(map(r => r.data));
  }

  delete(wsId: string, id: string) {
    return this.http.delete(`${this.url(wsId)}/${id}`);
  }
}
