import { type FetchMiddleware, createFetchApi } from './createFetchApi';

describe('createFetchApi', () => {
  it('Should default to the built in fetch', () => {
    // arrange

    // act
    const actual = createFetchApi({});

    // assert
    expect(actual.fetch).toBe(fetch);
  });

  it('Should use the baseImplementation if supplied', () => {
    // arrange
    const mockFetch: jest.MockedFn<typeof fetch> = jest.fn();

    // act
    const actual = createFetchApi({ baseImplementation: mockFetch });

    // assert
    expect(actual.fetch).toBe(mockFetch);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('Should work with a single middleware', () => {
    // arrange
    const mockFetch: jest.MockedFn<typeof fetch> = jest.fn();
    const middleware: jest.MockedFn<FetchMiddleware> = jest.fn();

    const middlewareFetch: jest.MockedFn<typeof fetch> = jest.fn();

    middleware.mockReturnValue(middlewareFetch);

    // act
    const actual = createFetchApi({
      baseImplementation: mockFetch,
      middleware: middleware,
    });

    // assert
    expect(actual.fetch).toBe(middlewareFetch);
    expect(middleware).toHaveBeenCalledTimes(1);
    expect(middleware).toHaveBeenCalledWith(mockFetch);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(middlewareFetch).not.toHaveBeenCalled();
  });

  it('Should call the middleware in the correct order', () => {
    // arrange
    const mockFetch: jest.MockedFn<typeof fetch> = jest.fn();
    const middleware1: jest.MockedFn<FetchMiddleware> = jest.fn();
    const middleware2: jest.MockedFn<FetchMiddleware> = jest.fn();
    const middleware3: jest.MockedFn<FetchMiddleware> = jest.fn();

    const middleware1Fetch: jest.MockedFn<typeof fetch> = jest.fn();
    const middleware2Fetch: jest.MockedFn<typeof fetch> = jest.fn();
    const middleware3Fetch: jest.MockedFn<typeof fetch> = jest.fn();

    middleware1.mockReturnValue(middleware1Fetch);
    middleware2.mockReturnValue(middleware2Fetch);
    middleware3.mockReturnValue(middleware3Fetch);

    // act
    const actual = createFetchApi({
      baseImplementation: mockFetch,
      middleware: [middleware1, middleware2, middleware3],
    });

    // assert
    expect(actual.fetch).toBe(middleware1Fetch);
    expect(middleware1).toHaveBeenCalledTimes(1);
    expect(middleware1).toHaveBeenCalledWith(middleware2Fetch);
    expect(middleware2).toHaveBeenCalledTimes(1);
    expect(middleware2).toHaveBeenCalledWith(middleware3Fetch);
    expect(middleware3).toHaveBeenCalledTimes(1);
    expect(middleware3).toHaveBeenCalledWith(mockFetch);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(middleware1Fetch).not.toHaveBeenCalled();
    expect(middleware2Fetch).not.toHaveBeenCalled();
    expect(middleware3Fetch).not.toHaveBeenCalled();
  });
});
