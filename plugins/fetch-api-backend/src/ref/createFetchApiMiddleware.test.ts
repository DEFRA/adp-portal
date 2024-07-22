import {
  type ServiceRef,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { FetchApiMiddleware } from '../types';
import { createFetchApiMiddleware } from './createFetchApiMiddleware';
import { ServiceFactoryTester } from '@backstage/backend-test-utils';
import { randomUUID } from 'node:crypto';

class DummyContext {
  #id;
  get id() {
    return this.#id;
  }
  constructor(id: number) {
    this.#id = id;
  }
}
class DummyService {
  #id;
  get id() {
    return this.#id;
  }
  constructor(id: number) {
    this.#id = id;
  }
}

describe('createFetchApiMiddleware', () => {
  it('Should create a plugin scoped middleware with a default factory', async () => {
    // arrange
    const impl: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const contextFactory: jest.MockedFn<() => DummyContext> = jest.fn();
    const factory: jest.MockedFn<() => FetchApiMiddleware> = jest.fn();
    const context = new DummyContext(42);
    const dep1 = new DummyService(1);
    const dep1Ref = makeDependencyRef(dep1, 'root');
    const dep2 = new DummyService(2);
    const dep2Ref = makeDependencyRef(dep2, 'plugin');
    const sut = createFetchApiMiddleware({
      id: 'test-middleware',
      deps: {
        dep1: dep1Ref,
        dep2: dep2Ref,
      },
      scope: 'plugin',
      createRootContext: contextFactory,
      factory,
    });
    const getterFactory = createServiceFactory({
      service: createServiceRef<FetchApiMiddleware>({
        id: 'getter',
        scope: 'plugin',
      }),
      deps: { sut },
      factory: dep => dep.sut,
    });

    contextFactory.mockReturnValueOnce(context);
    factory.mockReturnValueOnce(impl);
    const tester = ServiceFactoryTester.from(getterFactory);

    // act
    const actual = await tester.get();

    // assert
    expect(actual).toBe(impl);
    expect(impl).not.toHaveBeenCalled();
    expect(contextFactory).toHaveBeenCalledTimes(1);
    expect(contextFactory).toHaveBeenCalledWith({ dep1 });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith({ dep1, dep2 }, context);
  });

  it('Should create a root scoped middleware with a default factory', async () => {
    // arrange
    const impl: jest.MockedFn<FetchApiMiddleware> = jest.fn();
    const factory: jest.MockedFn<() => FetchApiMiddleware> = jest.fn();
    const dep1 = new DummyService(1);
    const dep1Ref = makeDependencyRef(dep1, 'root');
    const sut = createFetchApiMiddleware({
      id: 'test-middleware',
      deps: {
        dep1: dep1Ref,
      },
      scope: 'root',
      factory,
    });
    const getterFactory = createServiceFactory({
      service: createServiceRef<FetchApiMiddleware>({
        id: 'getter',
        scope: 'root',
      }),
      deps: { sut },
      factory: dep => dep.sut,
    });

    factory.mockReturnValueOnce(impl);
    const tester = ServiceFactoryTester.from(getterFactory);

    // act
    const actual = await tester.get();

    // assert
    expect(actual).toBe(impl);
    expect(impl).not.toHaveBeenCalled();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(factory).toHaveBeenCalledWith({ dep1 });
  });
});

function makeDependencyRef<T, Scope extends 'root' | 'plugin'>(
  dep: T,
  scope: Scope,
): ServiceRef<T, Scope> {
  return createServiceRef<T>({
    id: randomUUID(),
    scope: scope as 'plugin',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {},
        factory: () => dep,
      }),
  }) as ServiceRef<T, Scope>;
}
