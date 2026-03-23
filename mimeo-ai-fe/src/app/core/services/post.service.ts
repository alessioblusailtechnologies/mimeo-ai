import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

export type PostStatus = 'draft' | 'approved' | 'published';

export interface Post {
  id: string;
  user_id: string;
  workspace_id: string;
  agent_id: string;
  title: string | null;
  content: string;
  original_brief: string;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  post_id: string;
  content: string;
  ai_provider: string;
  ai_model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  generation_time_ms: number | null;
  is_selected: boolean;
  created_at: string;
}

export interface PostImage {
  id: string;
  post_id: string;
  prompt: string;
  public_url: string;
  ai_model: string;
  generation_time_ms: number | null;
  created_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  constructor(private http: HttpClient) {}

  private url(wsId: string) {
    return `${environment.apiUrl}/workspaces/${wsId}/posts`;
  }

  generate(wsId: string, agentId: string, brief: string, title?: string, referenceUrls?: string[]) {
    const body: Record<string, unknown> = { agent_id: agentId, brief, title };
    if (referenceUrls?.length) body['reference_urls'] = referenceUrls;
    return this.http.post<ApiResponse<{ post: Post; generations: Generation[] }>>(
      `${this.url(wsId)}/generate`,
      body
    ).pipe(map(r => r.data));
  }

  list(wsId: string, status?: PostStatus) {
    const params: Record<string, string> = {};
    if (status) params['status'] = status;
    return this.http.get<ApiResponse<Post[]>>(this.url(wsId), { params }).pipe(map(r => r.data));
  }

  getById(wsId: string, id: string) {
    return this.http.get<ApiResponse<Post>>(`${this.url(wsId)}/${id}`).pipe(map(r => r.data));
  }

  update(wsId: string, id: string, data: { title?: string; content?: string }) {
    return this.http.patch<ApiResponse<Post>>(`${this.url(wsId)}/${id}`, data).pipe(map(r => r.data));
  }

  regenerate(wsId: string, id: string, userFeedback?: string) {
    const body: Record<string, unknown> = {};
    if (userFeedback) body['user_feedback'] = userFeedback;
    return this.http.post<ApiResponse<{ post: Post; generation: Generation }>>(
      `${this.url(wsId)}/${id}/regenerate`, body
    ).pipe(map(r => r.data));
  }

  approve(wsId: string, id: string) {
    return this.http.post<ApiResponse<Post>>(`${this.url(wsId)}/${id}/approve`, {}).pipe(map(r => r.data));
  }

  publish(wsId: string, id: string) {
    return this.http.post<ApiResponse<Post>>(`${this.url(wsId)}/${id}/publish`, {}).pipe(map(r => r.data));
  }

  getGenerations(wsId: string, id: string) {
    return this.http.get<ApiResponse<Generation[]>>(`${this.url(wsId)}/${id}/generations`).pipe(map(r => r.data));
  }

  selectGeneration(wsId: string, postId: string, generationId: string) {
    return this.http.post<ApiResponse<Post>>(
      `${this.url(wsId)}/${postId}/generations/${generationId}/select`, {}
    ).pipe(map(r => r.data));
  }

  regenerateImages(wsId: string, postId: string, imageFeedback?: string) {
    const body: Record<string, unknown> = {};
    if (imageFeedback) body['image_feedback'] = imageFeedback;
    return this.http.post<ApiResponse<PostImage[]>>(
      `${this.url(wsId)}/${postId}/images/regenerate`, body
    ).pipe(map(r => r.data));
  }

  generateImages(wsId: string, postId: string, prompt: string, count: number = 1) {
    return this.http.post<ApiResponse<PostImage[]>>(
      `${this.url(wsId)}/${postId}/images/generate`, { prompt, count }
    ).pipe(map(r => r.data));
  }

  getImages(wsId: string, postId: string) {
    return this.http.get<ApiResponse<PostImage[]>>(
      `${this.url(wsId)}/${postId}/images`
    ).pipe(map(r => r.data));
  }

  deleteImage(wsId: string, postId: string, imageId: string) {
    return this.http.delete<ApiResponse<{ deleted: boolean }>>(
      `${this.url(wsId)}/${postId}/images/${imageId}`
    ).pipe(map(r => r.data));
  }
}
