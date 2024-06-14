import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { RequestContextMiddleware } from './RequestContextMiddleware';

export const requestContextMiddlewareRef =
  createServiceRef<RequestContextMiddleware>({
    id: 'express-request-context-middleware',
    scope: 'root',
    defaultFactory: service =>
      Promise.resolve(
        createServiceFactory({
          service,
          deps: {},
          factory() {
            return new RequestContextMiddleware();
          },
        }),
      ),
  });
