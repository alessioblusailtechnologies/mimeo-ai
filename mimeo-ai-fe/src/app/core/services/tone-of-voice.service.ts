import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

export interface ToneOfVoice {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  platform_type: string;
  description: string | null;
  style_profile: Record<string, unknown>;
  system_prompt_fragment: string;
  example_posts: string[];
  conversation_history: TovChatMessage[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TovChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface TovChatResponse {
  message: string;
  done: boolean;
  result?: {
    toneOfVoice: { id: string; name: string; description: string | null };
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ToneOfVoiceService {
  constructor(private http: HttpClient) {}

  private url(wsId: string) {
    return `${environment.apiUrl}/workspaces/${wsId}/tone-of-voice`;
  }

  list(wsId: string) {
    return this.http.get<ApiResponse<ToneOfVoice[]>>(this.url(wsId)).pipe(map(r => r.data));
  }

  getById(wsId: string, id: string) {
    return this.http.get<ApiResponse<ToneOfVoice>>(`${this.url(wsId)}/${id}`).pipe(map(r => r.data));
  }

  create(wsId: string, dto: Partial<ToneOfVoice>) {
    return this.http.post<ApiResponse<ToneOfVoice>>(this.url(wsId), dto).pipe(map(r => r.data));
  }

  update(wsId: string, id: string, dto: Partial<ToneOfVoice>) {
    return this.http.patch<ApiResponse<ToneOfVoice>>(`${this.url(wsId)}/${id}`, dto).pipe(map(r => r.data));
  }

  delete(wsId: string, id: string) {
    return this.http.delete(`${this.url(wsId)}/${id}`);
  }

  sendChat(wsId: string, message: string, history: TovChatMessage[], platformType: string) {
    return this.http.post<ApiResponse<TovChatResponse>>(
      `${this.url(wsId)}/chat`,
      { message, history, platform_type: platformType }
    ).pipe(map(r => r.data));
  }
}
