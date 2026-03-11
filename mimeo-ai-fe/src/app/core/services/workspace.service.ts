import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly url = `${environment.apiUrl}/workspaces`;

  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<ApiResponse<Workspace[]>>(this.url).pipe(map(r => r.data));
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Workspace>>(`${this.url}/${id}`).pipe(map(r => r.data));
  }

  create(dto: CreateWorkspaceDto) {
    return this.http.post<ApiResponse<Workspace>>(this.url, dto).pipe(map(r => r.data));
  }

  update(id: string, dto: Partial<CreateWorkspaceDto>) {
    return this.http.patch<ApiResponse<Workspace>>(`${this.url}/${id}`, dto).pipe(map(r => r.data));
  }

  delete(id: string) {
    return this.http.delete(`${this.url}/${id}`);
  }
}
