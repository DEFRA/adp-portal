import type { Fetch, FetchApiMiddleware } from '../types';
import { FetchApi } from './FetchApi';

describe('FetchApi', () => {
  it('Should use the global fetch if given no args', async () => {
    // arrange

    // act
    const actual = new FetchApi();

    // assert
    expect(actual.fetch).toBe(global.fetch);
  });
  it('Should create the factory using the root fetch implementation', async () => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();

    // act
    const actual = new FetchApi({ root: fetch });

    // assert
    expect(actual.fetch).toBe(fetch);
  });
  it('Should create the factory using the middleware in the correct order', async () => {
    // arrange
    const fetch: jest.MockedFn<Fetch> = jest.fn();

    const mw1 = createMiddleware();
    const mw2 = createMiddleware();
    const mw3 = createMiddleware();

    // act
    const actual = new FetchApi({
      root: fetch,
      middleware: [mw1.middleware, mw2.middleware, mw3.middleware],
    });

    // assert
    expect(actual.fetch).toBe(mw1.fetch);
    mw1.expectCalledWith(mw2.fetch);
    mw2.expectCalledWith(mw3.fetch);
    mw3.expectCalledWith(fetch);
  });
});

function createMiddleware() {
  const middleware: jest.MockedFn<FetchApiMiddleware> = jest.fn();
  const fetch: jest.MockedFn<Fetch> = jest.fn();

  middleware.mockReturnValueOnce(fetch);

  return {
    middleware,
    fetch,
    expectCalledWith(...params: Parameters<FetchApiMiddleware>) {
      expect(middleware).toHaveBeenCalledTimes(1);
      expect(middleware).toHaveBeenCalledWith(...params);
    },
  };
}
