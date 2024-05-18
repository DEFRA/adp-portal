import { createHeaderFetchMiddleware } from './createHeaderFetchMiddleware';
import { randomUUID } from 'node:crypto';

describe('createFetchHeaderMiddleware', () => {
  describe('Called with a function', () => {
    it('Should prefer the request headers when available', async () => {
      // arrange
      const apply: jest.MockedFn<(headers: Headers) => void | Promise<void>> =
        jest.fn();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const request = new Request('https://test.com');
      const expected = new Response();
      const init = Object.freeze<RequestInit>({
        headers: Object.freeze<[string, string][]>([]) as [string, string][],
      });

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(apply)(fetch);
      expect(apply).not.toHaveBeenCalled();
      const result = await actual(request, init);

      // assert
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledWith(request.headers, request, init);
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(request, init);
    });

    it('Should create an init if not supplied', async () => {
      // arrange
      const apply: jest.MockedFn<(headers: Headers) => void | Promise<void>> =
        jest.fn();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const url = new URL('https://test.com');

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(apply)(fetch);
      expect(apply).not.toHaveBeenCalled();
      const result = await actual(url);

      // assert
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply.mock.calls[0][0]).toBeInstanceOf(Headers);
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][1]?.headers).toBe(apply.mock.calls[0][0]);
      expect(fetch.mock.calls[0]).toMatchObject([
        url,
        { headers: apply.mock.calls[0][0] },
      ]);
    });

    it('Should construct the init headers if its not already constructed', async () => {
      // arrange
      const apply: jest.MockedFn<(headers: Headers) => void | Promise<void>> =
        jest.fn();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const init: RequestInit = {
        headers: [['abc', 'def']],
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(apply)(fetch);
      expect(apply).not.toHaveBeenCalled();
      const result = await actual('https://test.com', init);

      // assert
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledWith(
        init.headers,
        'https://test.com',
        init,
      );
      expect(init.headers).toBeInstanceOf(Headers);
      expect(init.headers).toMatchObject(new Headers([['abc', 'def']]));
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });

    it('Should use the init headers if its already constructed', async () => {
      // arrange
      const apply: jest.MockedFn<(headers: Headers) => void | Promise<void>> =
        jest.fn();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const headers = new Headers([['abc', 'def']]);
      const init: RequestInit = {
        headers,
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(apply)(fetch);
      expect(apply).not.toHaveBeenCalled();
      const result = await actual('https://test.com', init);

      // assert
      expect(apply).toHaveBeenCalledTimes(1);
      expect(apply).toHaveBeenCalledWith(
        init.headers,
        'https://test.com',
        init,
      );
      expect(init.headers).toBe(headers);
      expect(init.headers).toMatchObject(new Headers([['abc', 'def']]));
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });
  });
  describe('Called with a single pair', () => {
    it('Should prefer the request headers when available', async () => {
      // arrange
      const key = randomUUID();
      const value = randomUUID();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const request = new Request('https://test.com');
      const expected = new Response();
      const init = Object.freeze<RequestInit>({
        headers: Object.freeze<[string, string][]>([]) as [string, string][],
      });

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(key, value)(fetch);
      const result = await actual(request, init);

      // assert
      expect(result).toBe(expected);
      expect(request.headers).toMatchObject(new Headers([[key, value]]));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(request, init);
    });

    it('Should create an init if not supplied', async () => {
      // arrange
      const key = randomUUID();
      const value = randomUUID();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(key, value)(fetch);
      const result = await actual('https://test.com');

      // assert
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][1]?.headers).toBeInstanceOf(Headers);
      expect(fetch.mock.calls[0][1]?.headers).toMatchObject(
        new Headers([[key, value]]),
      );
      expect(fetch.mock.calls[0]).toMatchObject([
        'https://test.com',
        { headers: fetch.mock.calls[0][1]?.headers },
      ]);
    });

    it('Should construct the init headers if its not already constructed', async () => {
      // arrange
      const key = randomUUID();
      const value = randomUUID();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const init: RequestInit = {
        headers: [['abc', 'def']],
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(key, value)(fetch);
      const result = await actual('https://test.com', init);

      // assert
      expect(init.headers).toBeInstanceOf(Headers);
      expect(init.headers).toMatchObject(
        new Headers([
          ['abc', 'def'],
          [key, value],
        ]),
      );
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });

    it('Should use the init headers if its already constructed', async () => {
      // arrange
      const key = randomUUID();
      const value = randomUUID();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const headers = new Headers([['abc', 'def']]);
      const init: RequestInit = {
        headers,
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(key, value)(fetch);
      const result = await actual('https://test.com', init);

      // assert
      expect(init.headers).toBe(headers);
      expect(init.headers).toMatchObject(
        new Headers([
          ['abc', 'def'],
          [key, value],
        ]),
      );
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });

    it('Should not overwite an existing header', async () => {
      // arrange
      const key = randomUUID();
      const value = randomUUID();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const headers = new Headers([
        ['abc', 'def'],
        [key, 'something'],
      ]);
      const init: RequestInit = {
        headers,
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(key, value)(fetch);
      const result = await actual('https://test.com', init);

      // assert
      expect(init.headers).toBe(headers);
      expect(init.headers).toMatchObject(
        new Headers([
          ['abc', 'def'],
          [key, 'something'],
        ]),
      );
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });
    it('Should use a header value factory', async () => {
      // arrange
      const key = randomUUID();
      const value = randomUUID();
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const headers = new Headers([['abc', 'def']]);
      const init: RequestInit = {
        headers,
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(key, () => value)(fetch);
      const result = await actual('https://test.com', init);

      // assert
      expect(init.headers).toBe(headers);
      expect(init.headers).toMatchObject(
        new Headers([
          ['abc', 'def'],
          [key, value],
        ]),
      );
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });
  });
  describe('Called with multiple pairs', () => {
    it('Should prefer the request headers when available', async () => {
      // arrange
      const kvps = [
        [randomUUID(), randomUUID()],
        [randomUUID(), randomUUID()],
      ] as [string, string][];
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const request = new Request('https://test.com');
      const expected = new Response();
      const init = Object.freeze<RequestInit>({
        headers: Object.freeze<[string, string][]>([]) as [string, string][],
      });

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(...kvps)(fetch);
      const result = await actual(request, init);

      // assert
      expect(result).toBe(expected);
      expect(request.headers).toMatchObject(new Headers(kvps));
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(request, init);
    });

    it('Should create an init if not supplied', async () => {
      // arrange
      const kvps = [
        [randomUUID(), randomUUID()],
        [randomUUID(), randomUUID()],
      ] as [string, string][];
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(...kvps)(fetch);
      const result = await actual('https://test.com');

      // assert
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][1]?.headers).toBeInstanceOf(Headers);
      expect(fetch.mock.calls[0][1]?.headers).toMatchObject(new Headers(kvps));
      expect(fetch.mock.calls[0]).toMatchObject([
        'https://test.com',
        { headers: fetch.mock.calls[0][1]?.headers },
      ]);
    });

    it('Should construct the init headers if its not already constructed', async () => {
      // arrange
      const kvps = [
        [randomUUID(), randomUUID()],
        [randomUUID(), randomUUID()],
      ] as [string, string][];
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const init: RequestInit = {
        headers: [['abc', 'def']],
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(...kvps)(fetch);
      const result = await actual('https://test.com', init);

      // assert
      expect(init.headers).toBeInstanceOf(Headers);
      expect(init.headers).toMatchObject(
        new Headers([['abc', 'def'], ...kvps]),
      );
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });

    it('Should use the init headers if its already constructed', async () => {
      // arrange
      const kvps = [
        [randomUUID(), randomUUID()],
        [randomUUID(), randomUUID()],
      ] as [string, string][];
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const headers = new Headers([['abc', 'def']]);
      const init: RequestInit = {
        headers,
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(...kvps)(fetch);
      const result = await actual('https://test.com', init);

      // assert
      expect(init.headers).toBe(headers);
      expect(init.headers).toMatchObject(
        new Headers([['abc', 'def'], ...kvps]),
      );
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });

    it('Should not overwite an existing header', async () => {
      // arrange
      const kvps = [
        [randomUUID(), randomUUID()],
        [randomUUID(), randomUUID()],
      ] as [string, string][];
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const headers = new Headers([
        ['abc', 'def'],
        [kvps[0][0], 'something'],
      ]);
      const init: RequestInit = {
        headers,
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(...kvps)(fetch);
      const result = await actual('https://test.com', init);

      // assert
      expect(init.headers).toBe(headers);
      expect(init.headers).toMatchObject(
        new Headers([
          ['abc', 'def'],
          [kvps[0][0], 'something'],
          ...kvps.slice(1),
        ]),
      );
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });

    it('Should use a header value factory', async () => {
      // arrange
      const kvps = [
        [randomUUID(), randomUUID()],
        [randomUUID(), randomUUID()],
      ] as [string, string][];
      const fetch: jest.MockedFn<typeof global.fetch> = jest.fn();
      const expected = new Response();
      const headers = new Headers([['abc', 'def']]);
      const init: RequestInit = {
        headers,
      };

      fetch.mockResolvedValueOnce(expected);

      // act
      const actual = createHeaderFetchMiddleware(...kvps.map(toFactory))(fetch);
      const result = await actual('https://test.com', init);

      // assert
      expect(init.headers).toBe(headers);
      expect(init.headers).toMatchObject(
        new Headers([['abc', 'def'], ...kvps]),
      );
      expect(result).toBe(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('https://test.com', init);
    });
  });
});

function toFactory(kvp: [string, string]): [string, () => string] {
  return [kvp[0], () => kvp[1]];
}
