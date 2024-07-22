import {
  createServiceRef,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { ServiceFactoryTester } from '@backstage/backend-test-utils';
import type { Fetch, FetchApiMiddleware } from '../types';
import { fetchApiFactory } from './fetchApiFactory';
import { fetchApiRef } from '../ref';

describe('fetchApiFactory', () => {
  it('Should have the correct metadata', () => {
    // arrange
    const sut = fetchApiFactory();

    // act

    // assert
    expect(sut.$$type).toBe('@backstage/BackendFeature');
    expect(sut.service).toBe(fetchApiRef);
  });
  it('Should create the factory with no args', async () => {
    // arrange
    const sut = fetchApiFactory();
    const tester = ServiceFactoryTester.from(sut);

    // act
    const actual = await tester.get();

    // assert
    expect(actual.fetch).toBe(global.fetch);
  });
  it('Should create the factory using the root fetch implementation', async () => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();
    const sut = fetchApiFactory({
      root: fetch,
    });
    const tester = ServiceFactoryTester.from(sut);

    // act
    const actual = await tester.get();

    // assert
    expect(actual.fetch).toBe(fetch);
  });
  it('Should create the factory using the middleware in the correct order', async () => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();

    const mw1 = createMiddleware(1);
    const mw2 = createMiddleware(2);
    const mw3 = createMiddleware(3);

    const sut = fetchApiFactory({
      root: fetch,
      middleware: [mw1.ref, mw2.ref, mw3.ref],
    });
    const tester = ServiceFactoryTester.from(sut);

    // act
    const actual = await tester.get();

    // assert
    expect(actual.fetch).toBe(mw1.fetch);
    mw1.expectCalledWith(mw2.fetch);
    mw2.expectCalledWith(mw3.fetch);
    mw3.expectCalledWith(fetch);
  });
});

function createMiddleware(id: number) {
  const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
  const fetch: jest.MockedFn<Fetch> = jest.fn();
  const ref = createServiceRef<FetchApiMiddleware>({
    id: `mw${id}`,
    scope: 'plugin',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {},
        factory: () => middleware,
      }),
  });

  middleware.mockReturnValueOnce(fetch);

  return {
    middleware,
    fetch,
    ref,
    expectCalledWith(...params: Parameters<FetchApiMiddleware>) {
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(middleware).toHaveBeenCalledWith(...params);
    },
  };
}
