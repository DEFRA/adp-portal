import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Router } from 'express';
import PromiseRouter from 'express-promise-router';

export const routerFactoryRef = createServiceRef<typeof Router>({
  id: 'adp.router.factory',
  scope: 'root',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {},
        factory() {
          return PromiseRouter;
        },
      }),
    );
  },
});
