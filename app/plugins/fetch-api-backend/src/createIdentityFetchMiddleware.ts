import type { IdentityApi } from '@backstage/plugin-auth-node';
import type { Request } from 'express';
import type { FetchMiddleware } from './createFetchApi';
import { createFetchHeaderMiddleware } from './createFetchHeaderMiddleware';

export function createIdentityFetchMiddleware({
  identity,
  allowUrl,
  getCurrentRequest,
}: {
  identity: IdentityApi;
  allowUrl: (url: string) => boolean;
  getCurrentRequest: () => Request | undefined;
}): FetchMiddleware {
  return createFetchHeaderMiddleware(async (headers, input) => {
    if (headers.has('Authorization') || !allowUrl(getUrlString(input))) return;
    const request = getCurrentRequest();
    if (request === undefined) return;
    const { token } = (await identity.getIdentity({ request })) ?? {};
    if (!token) return;
    headers.append('Authorization', `Bearer ${token}`);
  });
}

function getUrlString(input: string | globalThis.Request | URL) {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}
