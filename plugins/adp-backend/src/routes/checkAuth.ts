import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import {
  AuthorizeResult,
  type DefinitivePolicyDecision,
  type AuthorizePermissionRequest,
} from '@backstage/plugin-permission-common';
import type { Request, RequestHandler } from 'express';
import { NotAllowedError } from '@backstage/errors';
import type { ParsedQs } from 'qs';

export type CheckAuthFactory = <
  P = {},
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
  Locals extends Record<string, unknown> = Record<string, unknown>,
>(
  getRequests: (
    request: Request<P, ResBody, ReqBody, ReqQuery, Locals>,
  ) => AuthorizePermissionRequest | AuthorizePermissionRequest[],
) => RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals>;

export default createServiceRef<CheckAuthFactory>({
  id: 'adp.router.middleware.checkAuth',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          httpAuth: coreServices.httpAuth,
          permissions: coreServices.permissions,
        },
        factory({ httpAuth, permissions }): CheckAuthFactory {
          return getRequests => async (req, _, next) => {
            const credentials = await httpAuth.credentials(req);
            const requests = getRequests(req);
            const decisions = await permissions.authorize([requests].flat(), {
              credentials: credentials,
            });
            if (anyDenied(decisions))
              return next(new NotAllowedError('Unauthorized'));

            return next();
          };
        },
      }),
    );
  },
});

function anyDenied(decisions: DefinitivePolicyDecision[]) {
  return decisions.some(d => d.result === AuthorizeResult.DENY);
}
