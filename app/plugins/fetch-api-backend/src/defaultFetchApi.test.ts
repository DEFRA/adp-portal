import { ConfigReader } from '@backstage/config';
import { type FetchMiddleware } from './createFetchApi';
import { defaultFetchApi } from './defaultFetchApi';
import type { Request as ExpressRequest } from 'express';
import { randomUUID } from 'node:crypto';

describe('defaultFetchApi', () => {
  it('Should default to the built in fetch', () => {
    // arrange

    // act
    const actual = defaultFetchApi({});

    // assert
    expect(actual.fetch).toBe(fetch);
  });

  it('Should use the baseImplementation if supplied', () => {
    // arrange
    const mockFetch: jest.MockedFn<typeof fetch> = jest.fn();

    // act
    const actual = defaultFetchApi({ baseImplementation: mockFetch });

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
    const actual = defaultFetchApi({
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
    const actual = defaultFetchApi({
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

  it('Should apply headers', async () => {
    // arrange
    const mockFetch: jest.MockedFn<typeof fetch> = jest.fn();
    const request = new Request('https://test.com');
    const expected = new Response();

    mockFetch.mockResolvedValueOnce(expected);

    // act
    const sut = defaultFetchApi({
      baseImplementation: mockFetch,
      headers: {
        test: '123',
      },
    });
    const actual = await sut.fetch(request);

    // assert
    expect(actual).toBe(expected);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(new Headers([['test', '123']]));
  });

  it('Should apply auth when there is an enclosing request', async () => {
    // arrange
    const token = randomUUID();
    const mockFetch: jest.MockedFn<typeof fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const expressRequest = { header: jest.fn() } as jest.Mocked<
      Partial<ExpressRequest>
    > as jest.Mocked<ExpressRequest>;
    const request = new Request('https://test.com');
    const expected = new Response();
    const config = {
      backend: {
        baseUrl: 'https://test.com',
      },
    };

    mockFetch.mockResolvedValueOnce(expected);
    getCurrentRequest.mockReturnValueOnce(expressRequest);
    expressRequest.header.mockReturnValueOnce(token);

    // act
    const sut = defaultFetchApi({
      baseImplementation: mockFetch,
      authorize: {
        config: new ConfigReader(config),
        getCurrentRequest,
      },
    });
    const actual = await sut.fetch(request);

    // assert
    expect(actual).toBe(expected);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(
      new Headers([['Authorization', token]]),
    );
  });

  it('Should not apply auth when there is no enclosing request', async () => {
    // arrange
    const mockFetch: jest.MockedFn<typeof fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const request = new Request('https://test.com');
    const expected = new Response();
    const config = {
      backend: {
        baseUrl: 'https://test.com',
      },
    };

    mockFetch.mockResolvedValueOnce(expected);
    getCurrentRequest.mockReturnValueOnce(undefined);

    // act
    const sut = defaultFetchApi({
      baseImplementation: mockFetch,
      authorize: {
        config: new ConfigReader(config),
        getCurrentRequest,
      },
    });
    const actual = await sut.fetch(request);

    // assert
    expect(actual).toBe(expected);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(new Headers([]));
  });

  it('Should not apply auth when the site is not allowed', async () => {
    // arrange
    const mockFetch: jest.MockedFn<typeof fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const request = new Request('https://evil.com');
    const expected = new Response();
    const config = {
      backend: {
        baseUrl: 'https://test.com',
      },
    };

    mockFetch.mockResolvedValueOnce(expected);

    // act
    const sut = defaultFetchApi({
      baseImplementation: mockFetch,
      authorize: {
        config: new ConfigReader(config),
        additionalConfigKeys: [],
        getCurrentRequest,
      },
    });
    const actual = await sut.fetch(request);

    // assert
    expect(actual).toBe(expected);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(new Headers([]));
    expect(getCurrentRequest).not.toHaveBeenCalled();
  });
});
