import type {
  BackstageIdentityResponse,
  IdentityApi,
} from '@backstage/plugin-auth-node';
import { createIdentityFetchMiddleware } from './createIdentityFetchMiddleware';
import type { Request as ExpressRequest } from 'express';

describe('createIdentityFetchMiddleware', () => {
  it('Should do nothing if an Authorization header is already added', async () => {
    // arrange
    const mockIdentity: jest.Mocked<IdentityApi> = {
      getIdentity: jest.fn(),
    };
    const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const request = new Request('https://test.com', {
      headers: [['Authorization', 'abc']],
    });
    const expected = new Response();

    fetch.mockResolvedValueOnce(expected);

    // act
    const actual = createIdentityFetchMiddleware({
      identity: mockIdentity,
      allowUrl: () => true,
      getCurrentRequest,
    })(fetch);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(getCurrentRequest).not.toHaveBeenCalled();
    const result = await actual(request);

    // assert
    expect(result).toBe(expected);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(getCurrentRequest).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(
      new Headers([['Authorization', 'abc']]),
    );
  });
  it('Should do nothing if the url is not allowed', async () => {
    // arrange
    const mockIdentity: jest.Mocked<IdentityApi> = {
      getIdentity: jest.fn(),
    };
    const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const request = new Request('https://test.com', {
      headers: [['Authorization', 'abc']],
    });
    const expected = new Response();

    fetch.mockResolvedValueOnce(expected);

    // act
    const actual = createIdentityFetchMiddleware({
      identity: mockIdentity,
      allowUrl: url => url !== 'https://test.com',
      getCurrentRequest,
    })(fetch);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(getCurrentRequest).not.toHaveBeenCalled();
    const result = await actual(request);

    // assert
    expect(result).toBe(expected);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(getCurrentRequest).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(
      new Headers([['Authorization', 'abc']]),
    );
  });
  it('Should do nothing if there is no current request', async () => {
    // arrange
    const mockIdentity: jest.Mocked<IdentityApi> = {
      getIdentity: jest.fn(),
    };
    const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const request = new Request('https://test.com');
    const expected = new Response();

    fetch.mockResolvedValueOnce(expected);
    getCurrentRequest.mockReturnValueOnce(undefined);

    // act
    const actual = createIdentityFetchMiddleware({
      identity: mockIdentity,
      allowUrl: () => true,
      getCurrentRequest,
    })(fetch);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(getCurrentRequest).not.toHaveBeenCalled();
    const result = await actual(request);

    // assert
    expect(result).toBe(expected);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(getCurrentRequest).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(new Headers());
  });
  it('Should do nothing when there is no identity associated with the current request', async () => {
    // arrange
    const mockIdentity: jest.Mocked<IdentityApi> = {
      getIdentity: jest.fn(),
    };
    const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const request = new Request('https://test.com');
    const expected = new Response();
    const expressRequest: ExpressRequest =
      {} satisfies Partial<ExpressRequest> as ExpressRequest;

    fetch.mockResolvedValueOnce(expected);
    getCurrentRequest.mockReturnValueOnce(expressRequest);
    mockIdentity.getIdentity.mockResolvedValueOnce(undefined);

    // act
    const actual = createIdentityFetchMiddleware({
      identity: mockIdentity,
      allowUrl: () => true,
      getCurrentRequest,
    })(fetch);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(getCurrentRequest).not.toHaveBeenCalled();
    const result = await actual(request);

    // assert
    expect(result).toBe(expected);
    expect(mockIdentity.getIdentity).toHaveBeenCalledTimes(1);
    expect(mockIdentity.getIdentity.mock.calls[0][0].request).toBe(
      expressRequest,
    );
    expect(getCurrentRequest).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(new Headers());
  });
  it('Should do nothing when there is no token associated with the current request', async () => {
    // arrange
    const mockIdentity: jest.Mocked<IdentityApi> = {
      getIdentity: jest.fn(),
    };
    const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const request = new Request('https://test.com');
    const expected = new Response();
    const expressRequest: ExpressRequest =
      {} satisfies Partial<ExpressRequest> as ExpressRequest;
    const identity: BackstageIdentityResponse = {
      identity: {
        ownershipEntityRefs: [],
        type: 'user',
        userEntityRef: '',
      },
      token: '',
      expiresInSeconds: 0,
    };

    fetch.mockResolvedValueOnce(expected);
    getCurrentRequest.mockReturnValueOnce(expressRequest);
    mockIdentity.getIdentity.mockResolvedValueOnce(identity);

    // act
    const actual = createIdentityFetchMiddleware({
      identity: mockIdentity,
      allowUrl: () => true,
      getCurrentRequest,
    })(fetch);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(getCurrentRequest).not.toHaveBeenCalled();
    const result = await actual(request);

    // assert
    expect(result).toBe(expected);
    expect(mockIdentity.getIdentity).toHaveBeenCalledTimes(1);
    expect(mockIdentity.getIdentity.mock.calls[0][0].request).toBe(
      expressRequest,
    );
    expect(getCurrentRequest).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(new Headers());
  });
  it('Should set the Authorization header when a token is available', async () => {
    // arrange
    const mockIdentity: jest.Mocked<IdentityApi> = {
      getIdentity: jest.fn(),
    };
    const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
    const getCurrentRequest: jest.MockedFn<() => ExpressRequest | undefined> =
      jest.fn();
    const request = new Request('https://test.com');
    const expected = new Response();
    const expressRequest: ExpressRequest =
      {} satisfies Partial<ExpressRequest> as ExpressRequest;
    const identity: BackstageIdentityResponse = {
      identity: {
        ownershipEntityRefs: [],
        type: 'user',
        userEntityRef: '',
      },
      token: 'abc',
      expiresInSeconds: 0,
    };

    fetch.mockResolvedValueOnce(expected);
    getCurrentRequest.mockReturnValueOnce(expressRequest);
    mockIdentity.getIdentity.mockResolvedValueOnce(identity);

    // act
    const actual = createIdentityFetchMiddleware({
      identity: mockIdentity,
      allowUrl: () => true,
      getCurrentRequest,
    })(fetch);
    expect(mockIdentity.getIdentity).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    expect(getCurrentRequest).not.toHaveBeenCalled();
    const result = await actual(request);

    // assert
    expect(result).toBe(expected);
    expect(mockIdentity.getIdentity).toHaveBeenCalledTimes(1);
    expect(mockIdentity.getIdentity.mock.calls[0][0].request).toBe(
      expressRequest,
    );
    expect(getCurrentRequest).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(request, undefined);
    expect(request.headers).toMatchObject(
      new Headers([['Authorization', 'Bearer abc']]),
    );
  });
});
