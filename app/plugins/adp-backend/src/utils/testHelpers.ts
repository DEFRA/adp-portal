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
import type { Express, Request, Response } from 'express';
import express from 'express';

export const testHelpers = {
  strictFn<T extends (...args: never) => unknown>() {
    return jest.fn(() => {
      throw new Error('Unexpected call');
    }) as unknown as jest.MockedFn<T>;
  },
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
  expressRequest(values: Partial<Request>) {
    return Object.create(
      express.request,
      Object.fromEntries(
        Object.entries(values).map(e => [e[0], { value: e[1] }]),
      ),
    ) as Request;
  },
  expressResponse(values: Partial<Response>) {
    return Object.create(
      express.response,
      Object.fromEntries(
        Object.entries(values).map(e => [e[0], { value: e[1] }]),
      ),
    ) as Response;
  },
};
