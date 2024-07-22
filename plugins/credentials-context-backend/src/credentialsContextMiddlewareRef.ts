import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Handler } from 'express';
import { credentialsContextServiceRef } from './credentialsContextServiceRef';
import { serviceId } from './serviceId';
import { credentialsContextMiddleware } from './credentialsContextMiddleware';

export const credentialsContextMiddlewareRef = createServiceRef<Handler>({
  id: serviceId('middleware'),
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          auth: coreServices.httpAuth,
          context: credentialsContextServiceRef,
        },
        factory: credentialsContextMiddleware,
      }),
    );
  },
});
