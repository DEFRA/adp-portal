import type { HttpAuthService } from '@backstage/backend-plugin-api';
import type { Handler } from 'express';
import type { CredentialsContextService } from './CredentialsContextService';

export interface CredentialsContextMiddlewareOptions {
  readonly auth: HttpAuthService;
  readonly context: CredentialsContextService;
}

export function credentialsContextMiddleware(
  options: CredentialsContextMiddlewareOptions,
): Handler {
  const { auth, context } = options;
  return function credentialsContext(req, _, next) {
    auth
      .credentials(req)
      .then(credentials => context.run(credentials, next))
      .catch(next);
  };
}
