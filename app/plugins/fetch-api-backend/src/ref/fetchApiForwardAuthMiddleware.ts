import { coreServices } from '@backstage/backend-plugin-api';
import { requestContextProviderRef } from '@internal/plugin-request-context-provider-backend';
import { createFetchApiForwardAuthMiddleware } from '../impl';
import { createFetchApiMiddleware } from './createFetchApiMiddleware';

export const fetchApiForwardAuthMiddleware = createFetchApiMiddleware({
  id: 'builtin.forward-auth',
  scope: 'root',
  deps: {
    filter: coreServices.rootConfig,
    requestContext: requestContextProviderRef,
  },
  factory: dep => createFetchApiForwardAuthMiddleware(dep),
});
