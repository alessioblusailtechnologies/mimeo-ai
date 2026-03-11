import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  done: boolean;
  results?: {
    agent: { id: string; name: string };
    posts: { id: string; title: string | null; content: string; status: string }[];
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  constructor(private http: HttpClient) {}

  send(wsId: string, message: string, history: ChatMessage[]) {
    return this.http.post<ApiResponse<ChatResponse>>(
      `${environment.apiUrl}/workspaces/${wsId}/chat`,
      { message, history }
    ).pipe(map(r => r.data));
  }
}
