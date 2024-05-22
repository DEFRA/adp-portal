import type { Request as ExpressRequest } from 'express';
import type { Fetch } from '../types';
import {
  createFetchApiForwardAuthMiddleware,
  type ForwardAuthHeaderMiddlewareOptions,
} from './createFetchApiForwardAuthMiddleware';
import type { RequestContextProvider } from '@internal/plugin-request-context-provider-backend';
import { ConfigReader } from '@backstage/config';

describe('createFetchApiForwardAuthMiddleware', () => {
  it.each<TestCase>([
    {
      name: 'string input but url disallowed by function',
      input: 'https://test.com',
      init: undefined,
      filter: url => url !== 'https://test.com',
      getRequest: false,
      request: undefined,
    },
    {
      name: 'URL input but url disallowed by function',
      input: new URL('https://test.com'),
      init: undefined,
      filter: url => url !== 'https://test.com/',
      getRequest: false,
      request: undefined,
    },
    {
      name: 'Request input but url disallowed by function',
      input: new Request('https://test.com'),
      init: undefined,
      filter: url => url !== 'https://test.com/',
      getRequest: false,
      request: undefined,
    },
    {
      name: 'string input but url disallowed by config',
      input: 'https://test.com',
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://someothersite.com',
        },
      }),
      getRequest: false,
      request: undefined,
    },
    {
      name: 'URL input but url disallowed by config',
      input: new URL('https://test.com'),
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://someothersite.com',
        },
      }),
      getRequest: false,
      request: undefined,
    },
    {
      name: 'Request input but url disallowed by config',
      input: new Request('https://test.com'),
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://someothersite.com',
        },
      }),
      getRequest: false,
      request: undefined,
    },
    {
      name: 'string input, url allowed by function, but no request',
      input: 'https://test.com',
      init: undefined,
      filter: url => url === 'https://test.com',
      getRequest: true,
      request: undefined,
    },
    {
      name: 'URL input, url allowed by function, but no request',
      input: new URL('https://test.com'),
      init: undefined,
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: undefined,
    },
    {
      name: 'Request input, url allowed by function, but no request',
      input: new Request('https://test.com'),
      init: undefined,
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: undefined,
    },
    {
      name: 'string input, url allowed by config baseUrl, but no request',
      input: 'https://test.com',
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://test.com/',
        },
      }),
      getRequest: true,
      request: undefined,
    },
    {
      name: 'URL input, url allowed by config baseUrl, but no request',
      input: new URL('https://test.com'),
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://test.com',
        },
      }),
      getRequest: true,
      request: undefined,
    },
    {
      name: 'Request input, url allowed by config baseUrl, but no request',
      input: new Request('https://test.com'),
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://test.com',
        },
      }),
      getRequest: true,
      request: undefined,
    },
    {
      name: 'string input, url allowed by config allow list, but no request',
      input: 'https://test.com',
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://other.com/',
          fetchApi: {
            forwardAuth: ['https://nope.com', 'https://test.com'],
          },
        },
      }),
      getRequest: true,
      request: undefined,
    },
    {
      name: 'URL input, url allowed by config allow list, but no request',
      input: new URL('https://test.com'),
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://other.com/',
          fetchApi: {
            forwardAuth: ['https://nope.com', 'https://test.com/'],
          },
        },
      }),
      getRequest: true,
      request: undefined,
    },
    {
      name: 'Request input, url allowed by config allow list, but no request',
      input: new Request('https://test.com'),
      init: undefined,
      filter: new ConfigReader({
        backend: {
          baseUrl: 'https://other.com/',
          fetchApi: {
            forwardAuth: ['https://nope.com', 'https://test.com/'],
          },
        },
      }),
      getRequest: true,
      request: undefined,
    },
    {
      name: 'string input, but no auth header',
      input: 'https://test.com',
      init: undefined,
      filter: url => url === 'https://test.com',
      getRequest: true,
      request: createMockRequest(undefined),
    },
    {
      name: 'URL input, but no auth header',
      input: new URL('https://test.com'),
      init: undefined,
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: createMockRequest(undefined),
    },
    {
      name: 'Request input, but no auth header',
      input: new Request('https://test.com'),
      init: undefined,
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: createMockRequest(undefined),
    },
    {
      name: 'string input, no init, with auth header',
      input: 'https://test.com',
      init: undefined,
      filter: url => url === 'https://test.com',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'string input, empty init, with auth header',
      input: 'https://test.com',
      init: {},
      filter: url => url === 'https://test.com',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'string input, init with header array, with auth header',
      input: 'https://test.com',
      init: { headers: [['Header1', 'abc']] },
      filter: url => url === 'https://test.com',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'string input, init with header array, with auth header already set',
      input: 'https://test.com',
      init: { headers: [['authorization', 'abc']] },
      filter: url => url === 'https://test.com',
      getRequest: false,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'string input, init with header object, with auth header',
      input: 'https://test.com',
      init: { headers: { Header1: 'abc' } },
      filter: url => url === 'https://test.com',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'string input, init with header object, with auth header already set',
      input: 'https://test.com',
      init: { headers: { authorization: 'abc' } },
      filter: url => url === 'https://test.com',
      getRequest: false,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'string input, init with headers instance, with auth header',
      input: 'https://test.com',
      init: { headers: new Headers({ Header1: 'abc' }) },
      filter: url => url === 'https://test.com',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'string input, init with headers instance, with auth header already set',
      input: 'https://test.com',
      init: { headers: new Headers({ authorization: 'abc' }) },
      filter: url => url === 'https://test.com',
      getRequest: false,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'URL input, no init, with auth header',
      input: new URL('https://test.com'),
      init: undefined,
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'URL input, empty init, with auth header',
      input: new URL('https://test.com'),
      init: {},
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'URL input, init with header array, with auth header',
      input: new URL('https://test.com'),
      init: { headers: [['Header1', 'abc']] },
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'URL input, init with header array, with auth header already set',
      input: new URL('https://test.com'),
      init: { headers: [['authorization', 'abc']] },
      filter: url => url === 'https://test.com/',
      getRequest: false,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'URL input, init with header object, with auth header',
      input: new URL('https://test.com'),
      init: { headers: { Header1: 'abc' } },
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'URL input, init with header object, with auth header already set',
      input: new URL('https://test.com'),
      init: { headers: { authorization: 'abc' } },
      filter: url => url === 'https://test.com/',
      getRequest: false,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'URL input, init with headers instance, with auth header',
      input: new URL('https://test.com'),
      init: { headers: new Headers({ Header1: 'abc' }) },
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'URL input, init with headers instance, with auth header already set',
      input: new URL('https://test.com'),
      init: { headers: new Headers({ authorization: 'abc' }) },
      filter: url => url === 'https://test.com/',
      getRequest: false,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'Request input, with auth header',
      input: new Request('https://test.com', { headers: { Header1: 'abc' } }),
      init: undefined,
      filter: url => url === 'https://test.com/',
      getRequest: true,
      request: createMockRequest('my auth token'),
    },
    {
      name: 'Request input, with auth already set',
      input: new Request('https://test.com', {
        headers: { authorization: 'abc' },
      }),
      init: undefined,
      filter: url => url === 'https://test.com/',
      getRequest: false,
      request: createMockRequest('my auth token'),
    },
  ])(
    'Should work with $name',
    async ({ input, init, request, getRequest, filter }) => {
      // arrange
      const fetch: jest.MockedFn<Fetch> = jest.fn();
      const requestContext: jest.Mocked<RequestContextProvider> = {
        getContext: jest.fn(),
      };
      const sut = createFetchApiForwardAuthMiddleware({
        filter,
        requestContext,
      })(fetch);
      const response = new Response();
      if (getRequest)
        requestContext.getContext.mockReturnValueOnce(
          request ? { request } : undefined,
        );

      fetch.mockResolvedValueOnce(response);

      // act
      const actual = await sut(input, init);

      // assert
      expect(actual).toBe(response);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0]).toMatchSnapshot();
      expect(requestContext.getContext).toHaveBeenCalledTimes(
        getRequest ? 1 : 0,
      );
    },
  );
});

interface TestCase {
  readonly name: string;
  readonly input: Parameters<Fetch>[0];
  readonly init: Parameters<Fetch>[1];
  readonly filter: ForwardAuthHeaderMiddlewareOptions['filter'];
  readonly request: ExpressRequest | undefined;
  readonly getRequest: boolean;
}

function createMockRequest(authHeader: string | undefined) {
  return {
    header(name) {
      expect(name).toBe('authorization');
      return authHeader;
    },
  } as Partial<ExpressRequest> as ExpressRequest;
}
