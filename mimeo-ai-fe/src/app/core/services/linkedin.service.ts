import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

export interface LinkedInConnectionInfo {
  id: string;
  workspace_id: string;
  linkedin_organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  token_expires_at: string;
  is_token_valid: boolean;
  connected_at: string;
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  logo_url: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class LinkedInService {
  constructor(private http: HttpClient) {}

  private url(wsId: string) {
    return `${environment.apiUrl}/workspaces/${wsId}/linkedin`;
  }

  getOAuthUrl(wsId: string, redirectUri: string) {
    return this.http.get<ApiResponse<{ url: string; state: string }>>(
      `${this.url(wsId)}/oauth-url`,
      { params: { redirect_uri: redirectUri } }
    ).pipe(map(r => r.data));
  }

  exchangeCode(wsId: string, code: string, redirectUri: string) {
    return this.http.post<ApiResponse<{ organizations: LinkedInOrganization[] }>>(
      `${this.url(wsId)}/exchange`,
      { code, redirect_uri: redirectUri }
    ).pipe(map(r => r.data));
  }

  selectOrganization(wsId: string, orgId: string, orgName: string, orgLogoUrl?: string) {
    return this.http.post<ApiResponse<LinkedInConnectionInfo>>(
      `${this.url(wsId)}/select-organization`,
      { organization_id: orgId, organization_name: orgName, organization_logo_url: orgLogoUrl }
    ).pipe(map(r => r.data));
  }

  getConnection(wsId: string) {
    return this.http.get<ApiResponse<LinkedInConnectionInfo | null>>(
      `${this.url(wsId)}/connection`
    ).pipe(map(r => r.data));
  }

  disconnect(wsId: string) {
    return this.http.delete(`${this.url(wsId)}/connection`);
  }
}
