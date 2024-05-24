import {
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type * as CreateFetchApiForPluginMiddleware from '../impl/createFetchApiForPluginMiddleware';
import type { FetchApiMiddleware } from '../types';
import { fetchApiForPluginMiddleware } from './fetchApiForPluginMiddleware';
import { ServiceFactoryTester } from '@backstage/backend-test-utils';

const createFetchApiForPluginMiddleware: jest.MockedFn<
  (typeof CreateFetchApiForPluginMiddleware)['createFetchApiForPluginMiddleware']
> = jest.fn();

beforeEach(() => {
  createFetchApiForPluginMiddleware.mockClear();
});

describe('fetchApiForPluginMiddleware', () => {
  it('Should default to createFetchApiForPluginMiddleware with single plugin id', async () => {
    // arrange
    const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const child: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const childRef = createServiceRef<FetchApiMiddleware>({
      id: 'test-service',
      scope: 'plugin',
      defaultFactory: async service =>
        createServiceFactory({
          service,
          deps: {},
          factory: () => child,
        }),
    });
    const sut = fetchApiForPluginMiddleware({
      pluginId: 'target-plugin',
      middleware: childRef,
    });
    const getterFactory = createServiceFactory({
      service: createServiceRef<FetchApiMiddleware>({
        id: 'getter',
        scope: 'plugin',
      }),
      deps: { sut },
      factory: dep => dep.sut,
    });
    const tester = ServiceFactoryTester.from(getterFactory);

    createFetchApiForPluginMiddleware.mockReturnValueOnce(middleware);

    // act
    const actual = await tester.get('actual-plugin');

    // assert
    expect(sut.id).toBe(
      'fetch-api.middleware.builtin.forplugin.target-plugin.test-service',
    );
    expect(sut.scope).toBe('plugin');
    expect(actual).toBe(middleware);
    expect(createFetchApiForPluginMiddleware).toHaveBeenCalledTimes(1);
    const arg = createFetchApiForPluginMiddleware.mock.calls[0][0];
    expect(arg.pluginId).toBe('target-plugin');
    expect(arg.middleware).toBe(child);
    expect(arg.pluginMetadata.getId()).toBe('actual-plugin');
  });
  it('Should default to createFetchApiForPluginMiddleware with multiple plugin ids', async () => {
    // arrange
    const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const child: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const childRef = createServiceRef<FetchApiMiddleware>({
      id: 'test-service',
      scope: 'plugin',
      defaultFactory: async service =>
        createServiceFactory({
          service,
          deps: {},
          factory: () => child,
        }),
    });
    const sut = fetchApiForPluginMiddleware({
      pluginId: ['target-plugin1', 'target-plugin2'],
      middleware: childRef,
    });
    const getterFactory = createServiceFactory({
      service: createServiceRef<FetchApiMiddleware>({
        id: 'getter',
        scope: 'plugin',
      }),
      deps: { sut },
      factory: dep => dep.sut,
    });
    const tester = ServiceFactoryTester.from(getterFactory);

    createFetchApiForPluginMiddleware.mockReturnValueOnce(middleware);

    // act
    const actual = await tester.get('actual-plugin');

    // assert
    expect(sut.id).toBe(
      'fetch-api.middleware.builtin.forplugin.target-plugin1+target-plugin2.test-service',
    );
    expect(sut.scope).toBe('plugin');
    expect(actual).toBe(middleware);
    expect(createFetchApiForPluginMiddleware).toHaveBeenCalledTimes(1);
    const arg = createFetchApiForPluginMiddleware.mock.calls[0][0];
    expect(arg.pluginId).toMatchObject(['target-plugin1', 'target-plugin2']);
    expect(arg.middleware).toBe(child);
    expect(arg.pluginMetadata.getId()).toBe('actual-plugin');
  });
});

jest.mock(
  '../impl/createFetchApiForPluginMiddleware',
  () =>
    ({
      get createFetchApiForPluginMiddleware() {
        return createFetchApiForPluginMiddleware;
      },
    } satisfies typeof CreateFetchApiForPluginMiddleware),
);
