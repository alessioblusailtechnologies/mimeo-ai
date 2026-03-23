import { config } from '../../config/index.js';
import { BadRequestError } from '../../utils/api-error.js';

const LINKEDIN_API_BASE = 'https://api.linkedin.com/rest';
const LINKEDIN_API_VERSION = '202401';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

export function getOAuthUrl(redirectUri: string, state: string): string {
  const linkedinConfig = config.linkedin;
  if (!linkedinConfig) throw new BadRequestError('LinkedIn integration not configured');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: linkedinConfig.clientId,
    redirect_uri: redirectUri,
    scope: 'w_member_social w_organization_social r_organization_social',
    state,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResponse> {
  const linkedinConfig = config.linkedin;
  if (!linkedinConfig) throw new BadRequestError('LinkedIn integration not configured');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: linkedinConfig.clientId,
    client_secret: linkedinConfig.clientSecret,
  });

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new BadRequestError(`LinkedIn token exchange failed: ${error}`);
  }

  return res.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const linkedinConfig = config.linkedin;
  if (!linkedinConfig) throw new BadRequestError('LinkedIn integration not configured');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: linkedinConfig.clientId,
    client_secret: linkedinConfig.clientSecret,
  });

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new BadRequestError(`LinkedIn token refresh failed: ${error}`);
  }

  return res.json() as Promise<TokenResponse>;
}

export async function getAdministeredOrganizations(
  accessToken: string
): Promise<Array<{ id: string; name: string; logo_url: string | null }>> {
  const aclRes = await fetch(
    `${LINKEDIN_API_BASE}/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization))`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_API_VERSION,
      },
    }
  );

  if (!aclRes.ok) throw new BadRequestError('Failed to fetch LinkedIn organizations');
  const aclData = await aclRes.json() as any;

  const orgIds: string[] = (aclData.elements || [])
    .map((el: any) => {
      const urn: string = el.organization || '';
      return urn.replace('urn:li:organization:', '');
    })
    .filter(Boolean);

  if (orgIds.length === 0) return [];

  const orgs = await Promise.all(
    orgIds.map(async (orgId) => {
      try {
        const orgRes = await fetch(
          `${LINKEDIN_API_BASE}/organizations/${orgId}?projection=(id,localizedName,logoV2)`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'LinkedIn-Version': LINKEDIN_API_VERSION,
            },
          }
        );
        if (!orgRes.ok) return { id: orgId, name: `Organization ${orgId}`, logo_url: null };
        const orgData = await orgRes.json() as any;
        return {
          id: String(orgData.id || orgId),
          name: orgData.localizedName || `Organization ${orgId}`,
          logo_url: orgData.logoV2?.original?.url || null,
        };
      } catch {
        return { id: orgId, name: `Organization ${orgId}`, logo_url: null };
      }
    })
  );

  return orgs;
}

export async function createTextPost(
  accessToken: string,
  organizationId: string,
  text: string
): Promise<{ postUrn: string }> {
  const res = await fetch(`${LINKEDIN_API_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: JSON.stringify({
      author: `urn:li:organization:${organizationId}`,
      commentary: text,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new BadRequestError(`LinkedIn post creation failed: ${error}`);
  }

  const postUrn = res.headers.get('x-restli-id') || '';
  return { postUrn };
}

export async function initializeImageUpload(
  accessToken: string,
  organizationId: string
): Promise<{ uploadUrl: string; imageUrn: string }> {
  const res = await fetch(`${LINKEDIN_API_BASE}/images?action=initializeUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: `urn:li:organization:${organizationId}`,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new BadRequestError(`LinkedIn image upload init failed: ${error}`);
  }

  const data = await res.json() as any;
  return {
    uploadUrl: data.value.uploadUrl,
    imageUrn: data.value.image,
  };
}

export async function uploadImageBinary(
  uploadUrl: string,
  imageBuffer: Buffer,
  contentType = 'image/png'
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: imageBuffer,
  });

  if (!res.ok) {
    throw new BadRequestError('LinkedIn image binary upload failed');
  }
}

export async function createImagePost(
  accessToken: string,
  organizationId: string,
  text: string,
  imageUrns: string[]
): Promise<{ postUrn: string }> {
  const body: any = {
    author: `urn:li:organization:${organizationId}`,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false,
  };

  if (imageUrns.length === 1) {
    body.content = { media: { id: imageUrns[0] } };
  } else if (imageUrns.length > 1) {
    body.content = {
      multiImage: {
        images: imageUrns.map((urn) => ({ id: urn, altText: '' })),
      },
    };
  }

  const res = await fetch(`${LINKEDIN_API_BASE}/posts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new BadRequestError(`LinkedIn image post creation failed: ${error}`);
  }

  const postUrn = res.headers.get('x-restli-id') || '';
  return { postUrn };
}
