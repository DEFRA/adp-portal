import {
  coreServices,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { requestContextProviderRef } from './requestContextProviderRef';
import { RequestContextMiddleware } from './RequestContextMiddleware';

export const requestContextProviderFactory = createServiceFactory({
  service: requestContextProviderRef,
  deps: {
    router: coreServices.rootHttpRouter,
  },
  factory({ router }) {
    const middleware = new RequestContextMiddleware();
    router.use('/(request-context-provider)?*', middleware.handler);
    return middleware.provider;
  },
});
