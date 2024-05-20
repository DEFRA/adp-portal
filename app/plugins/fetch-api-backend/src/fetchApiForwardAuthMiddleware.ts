import { coreServices } from '@backstage/backend-plugin-api';
import { requestContextProviderRef } from '@internal/plugin-request-context-provider-backend';
import { createFetchApiForwardAuthMiddleware } from './createFetchApiForwardAuthMiddleware';
import { createFetchApiMiddleware } from './createFetchApiMiddleware';

export const fetchApiForwardAuthMiddleware = createFetchApiMiddleware({
  id: 'builtin.forward-auth',
  scope: 'root',
  deps: {
    filter: coreServices.rootConfig,
    requestContext: requestContextProviderRef,
  },
  factory: createFetchApiForwardAuthMiddleware,
});
