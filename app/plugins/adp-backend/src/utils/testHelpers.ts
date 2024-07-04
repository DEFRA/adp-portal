import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  type ServiceFactory,
  type ServiceRef,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
// Disable warning as this file is only used for testing.
// eslint-disable-next-line @backstage/no-undeclared-imports
import {
  ServiceFactoryTester,
  mockServices,
} from '@backstage/backend-test-utils';
import type { Express } from 'express';
import express from 'express';

export const testHelpers = {
  async getAutoServiceRef<T>(
    reference: ServiceRef<T>,
    dependencies?: Array<ServiceFactory>,
  ) {
    const tester = ServiceFactoryTester.from(
      createServiceFactory({
        service: createServiceRef<T>({ id: 'test', scope: 'plugin' }),
        deps: {
          reference,
        },
        factory(deps) {
          return deps.reference;
        },
      }),
      {
        dependencies,
      },
    );

    return await tester.get();
  },
  provideService<T>(ref: ServiceRef<T>, implementation: T) {
    return createServiceFactory({
      service: ref as ServiceRef<T, 'plugin'>,
      deps: {},
      factory: () => implementation,
    })();
  },
  makeApp(configure: (app: Express) => void) {
    const app = express();
    app.use(express.json());
    configure(app);
    app.use(
      MiddlewareFactory.create({
        config: mockServices.rootConfig(),
        logger: mockServices.logger.mock(),
      }).error(),
    );
    return app;
  },
};
