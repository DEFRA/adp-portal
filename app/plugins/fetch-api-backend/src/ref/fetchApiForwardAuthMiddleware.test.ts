import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type * as CreateFetchApiForwardAuthMiddleware from '../impl/createFetchApiForwardAuthMiddleware';
import type { FetchApiMiddleware } from '../types';
import { fetchApiForwardAuthMiddleware } from './fetchApiForwardAuthMiddleware';
import { ServiceFactoryTester } from '@backstage/backend-test-utils';
import {
  type RequestContextProvider,
  requestContextProviderRef,
} from '@internal/plugin-request-context-provider-backend';
import type { Config } from '@backstage/config';

const createFetchApiForwardAuthMiddleware: jest.MockedFn<
  (typeof CreateFetchApiForwardAuthMiddleware)['createFetchApiForwardAuthMiddleware']
> = jest.fn();

beforeEach(() => {
  createFetchApiForwardAuthMiddleware.mockClear();
});

describe('fetchApiForwardAuthMiddleware', () => {
  it('Should default to createFetchApiForwardAuthMiddleware', async () => {
    // arrange
    const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const config = createMockConfig();
    const requestContextProvider: jest.Mocked<RequestContextProvider> = {
      getContext: jest.fn(),
    };
    const getterFactory = createServiceFactory({
      service: createServiceRef<FetchApiMiddleware>({
        id: 'getter',
        scope: 'plugin',
      }),
      deps: { sut: fetchApiForwardAuthMiddleware },
      factory: dep => dep.sut,
    });
    const requestContextProviderFactory = createServiceFactory({
      service: requestContextProviderRef,
      deps: {},
      factory: () => requestContextProvider,
    });
    const rootConfigFactory = createServiceFactory({
      service: coreServices.rootConfig,
      deps: {},
      factory: () => config,
    });
    const tester = ServiceFactoryTester.from(getterFactory, {
      dependencies: [requestContextProviderFactory, rootConfigFactory],
    });

    createFetchApiForwardAuthMiddleware.mockReturnValueOnce(middleware);

    // act
    const actual = await tester.get();

    // assert
    expect(actual).toBe(middleware);
    expect(createFetchApiForwardAuthMiddleware).toHaveBeenCalledTimes(1);
    expect(createFetchApiForwardAuthMiddleware).toHaveBeenCalledWith({
      filter: config,
      requestContext: requestContextProvider,
    });
  });
});

jest.mock(
  '../impl/createFetchApiForwardAuthMiddleware',
  () =>
    ({
      get createFetchApiForwardAuthMiddleware() {
        return createFetchApiForwardAuthMiddleware;
      },
    }) satisfies typeof CreateFetchApiForwardAuthMiddleware,
);

function createMockConfig(): jest.Mocked<Config> {
  return {
    get: jest.fn(),
    getBoolean: jest.fn(),
    getConfig: jest.fn(),
    getConfigArray: jest.fn(),
    getNumber: jest.fn(),
    getOptional: jest.fn(),
    getOptionalBoolean: jest.fn(),
    getOptionalConfig: jest.fn(),
    getOptionalConfigArray: jest.fn(),
    getOptionalNumber: jest.fn(),
    getOptionalString: jest.fn(),
    getOptionalStringArray: jest.fn(),
    getString: jest.fn(),
    getStringArray: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    subscribe: jest.fn(),
  };
}
