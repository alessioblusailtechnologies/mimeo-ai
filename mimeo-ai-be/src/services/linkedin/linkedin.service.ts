import * as linkedInRepo from '../../repositories/linkedin.repository.js';
import * as linkedInApi from './linkedin-api.service.js';
import * as workspaceRepo from '../../repositories/workspace.repository.js';
import { BadRequestError } from '../../utils/api-error.js';
import { randomUUID } from 'crypto';
import type { LinkedInConnectionInfo, LinkedInOrganization } from '../../types/linkedin.types.js';

export function getOAuthUrl(workspaceId: string, redirectUri: string): { url: string; state: string } {
  const state = `${workspaceId}:${randomUUID()}`;
  const url = linkedInApi.getOAuthUrl(redirectUri, state);
  return { url, state };
}

export async function exchangeCode(
  workspaceId: string,
  userId: string,
  code: string,
  redirectUri: string
): Promise<{ organizations: LinkedInOrganization[] }> {
  await workspaceRepo.findById(workspaceId, userId);

  const tokenResponse = await linkedInApi.exchangeCodeForToken(code, redirectUri);

  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();
  const refreshExpiresAt = tokenResponse.refresh_token_expires_in
    ? new Date(Date.now() + tokenResponse.refresh_token_expires_in * 1000).toISOString()
    : null;

  await linkedInRepo.upsert({
    workspace_id: workspaceId,
    user_id: userId,
    linkedin_organization_id: '__pending__',
    organization_name: 'Pending selection',
    organization_logo_url: null,
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || null,
    token_expires_at: expiresAt,
    refresh_token_expires_at: refreshExpiresAt,
    scopes: tokenResponse.scope || '',
  });

  const organizations = await linkedInApi.getAdministeredOrganizations(tokenResponse.access_token);
  return { organizations };
}

export async function selectOrganization(
  workspaceId: string,
  userId: string,
  organizationId: string,
  organizationName: string,
  organizationLogoUrl?: string
): Promise<LinkedInConnectionInfo> {
  const connection = await linkedInRepo.findByWorkspaceId(workspaceId, userId);
  if (!connection) throw new BadRequestError('No pending LinkedIn connection found. Start OAuth flow first.');

  const updated = await linkedInRepo.upsert({
    workspace_id: workspaceId,
    user_id: userId,
    linkedin_organization_id: organizationId,
    organization_name: organizationName,
    organization_logo_url: organizationLogoUrl || null,
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    token_expires_at: connection.token_expires_at,
    refresh_token_expires_at: connection.refresh_token_expires_at,
    scopes: connection.scopes,
  });

  return toConnectionInfo(updated);
}

export async function getConnection(workspaceId: string, userId: string): Promise<LinkedInConnectionInfo | null> {
  const connection = await linkedInRepo.findByWorkspaceId(workspaceId, userId);
  if (!connection || connection.linkedin_organization_id === '__pending__') return null;
  return toConnectionInfo(connection);
}

export async function disconnect(workspaceId: string, userId: string): Promise<void> {
  await linkedInRepo.remove(workspaceId, userId);
}

export async function getValidAccessToken(
  workspaceId: string,
  userId: string
): Promise<{ token: string; organizationId: string }> {
  const connection = await linkedInRepo.findByWorkspaceId(workspaceId, userId);
  if (!connection || connection.linkedin_organization_id === '__pending__') {
    throw new BadRequestError('No LinkedIn connection configured for this workspace');
  }

  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);

  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    if (!connection.refresh_token) {
      throw new BadRequestError('LinkedIn access token expired. Please reconnect.');
    }

    const refreshExpiresAt = connection.refresh_token_expires_at
      ? new Date(connection.refresh_token_expires_at)
      : null;
    if (refreshExpiresAt && refreshExpiresAt < now) {
      throw new BadRequestError('LinkedIn refresh token expired. Please reconnect.');
    }

    const newTokens = await linkedInApi.refreshAccessToken(connection.refresh_token);
    const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();
    const newRefreshExpiresAt = newTokens.refresh_token_expires_in
      ? new Date(Date.now() + newTokens.refresh_token_expires_in * 1000).toISOString()
      : connection.refresh_token_expires_at;

    await linkedInRepo.updateTokens(workspaceId, userId, {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || connection.refresh_token || undefined,
      token_expires_at: newExpiresAt,
      refresh_token_expires_at: newRefreshExpiresAt || undefined,
    });

    return { token: newTokens.access_token, organizationId: connection.linkedin_organization_id };
  }

  return { token: connection.access_token, organizationId: connection.linkedin_organization_id };
}

function toConnectionInfo(c: any): LinkedInConnectionInfo {
  return {
    id: c.id,
    workspace_id: c.workspace_id,
    linkedin_organization_id: c.linkedin_organization_id,
    organization_name: c.organization_name,
    organization_logo_url: c.organization_logo_url,
    token_expires_at: c.token_expires_at,
    is_token_valid: new Date(c.token_expires_at) > new Date(),
    connected_at: c.created_at,
  };
}
