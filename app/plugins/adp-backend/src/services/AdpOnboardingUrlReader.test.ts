import { mockServices } from '@backstage/backend-test-utils';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { AdpOnboardingUrlReader } from './AdpOnboardingUrlReader';
import type { ReadTreeResponseFactory } from '@backstage/backend-defaults/dist/urlReader';
import { NotFoundError, NotModifiedError } from '@backstage/errors';

describe('AdpOnboardingUrlReader', () => {
  describe('readUrl', () => {
    it('Should error when trying to read any url it does not support', async () => {
      const { sut, fetchApi } = setup();

      const test = () => sut.readUrl('http://some-other-site.com');

      await expect(test).rejects.toThrow(
        'Unsupported url http://some-other-site.com',
      );
      expect(fetchApi.fetch).not.toHaveBeenCalled();
    });

    it('Should throw NotModifiedError if it gets a 304 response', async () => {
      const { sut, fetchApi } = setup();
      fetchApi.fetch.mockResolvedValueOnce(new Response(null, { status: 304 }));

      const test = () => sut.readUrl('http://test.com/onboarding/something');

      await expect(test).rejects.toThrow(NotModifiedError);
      expect(fetchApi.fetch).toHaveBeenCalledTimes(1);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:0/api/adp/catalog/something/entity.yaml',
        {
          headers: {
            Authorization:
              'Bearer mock-service-token:{"sub":"plugin:test","target":"adp"}',
          },
          signal: undefined,
        },
      );
    });

    it('Should throw NotFoundError if it gets a 404 response', async () => {
      const { sut, fetchApi } = setup();
      fetchApi.fetch.mockResolvedValueOnce(new Response(null, { status: 404 }));

      const test = () => sut.readUrl('http://test.com/onboarding/something');

      await expect(test).rejects.toThrow(NotFoundError);
      expect(fetchApi.fetch).toHaveBeenCalledTimes(1);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:0/api/adp/catalog/something/entity.yaml',
        {
          headers: {
            Authorization:
              'Bearer mock-service-token:{"sub":"plugin:test","target":"adp"}',
          },
          signal: undefined,
        },
      );
    });

    it('Should throw an error if it gets a failed response', async () => {
      const { sut, fetchApi } = setup();
      fetchApi.fetch.mockResolvedValueOnce(
        Object.create(new Response(null, { status: 200 }), {
          ok: { value: false },
        }) as Response,
      );

      const test = () => sut.readUrl('http://test.com/onboarding/something');

      await expect(test).rejects.toThrow(Error);
      expect(fetchApi.fetch).toHaveBeenCalledTimes(1);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:0/api/adp/catalog/something/entity.yaml',
        {
          headers: {
            Authorization:
              'Bearer mock-service-token:{"sub":"plugin:test","target":"adp"}',
          },
          signal: undefined,
        },
      );
    });

    it('Should throw NotModified if the response body has not changed', async () => {
      const { sut, fetchApi } = setup();
      fetchApi.fetch.mockResolvedValueOnce(
        new Response('This is some text', { status: 200 }),
      );

      const test = () =>
        sut.readUrl('http://test.com/onboarding/something', {
          etag: '97214f63224bc1e9cc4da377aadce7c7',
        });

      await expect(test).rejects.toThrow(NotModifiedError);
      expect(fetchApi.fetch).toHaveBeenCalledTimes(1);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:0/api/adp/catalog/something/entity.yaml',
        {
          headers: {
            Authorization:
              'Bearer mock-service-token:{"sub":"plugin:test","target":"adp"}',
          },
          signal: undefined,
        },
      );
    });

    it('Should return the response data on a successful response', async () => {
      const { sut, fetchApi } = setup();
      const controller = new AbortController();
      fetchApi.fetch.mockResolvedValueOnce(
        new Response('This is some text', { status: 200 }),
      );

      const actual = await sut.readUrl('http://test.com/onboarding/something', {
        etag: '123',
        signal: controller.signal,
      });

      expect(actual.etag).toBe('97214f63224bc1e9cc4da377aadce7c7');
      expect((await actual.buffer()).toString()).toBe('This is some text');
      expect(fetchApi.fetch).toHaveBeenCalledTimes(1);
      expect(fetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:0/api/adp/catalog/something/entity.yaml',
        {
          headers: {
            Authorization:
              'Bearer mock-service-token:{"sub":"plugin:test","target":"adp"}',
          },
          signal: controller.signal,
        },
      );
    });
  });
});

function setup() {
  const config = mockServices.rootConfig({
    data: {
      app: {
        baseUrl: 'http://test.com',
      },
    },
  });
  const fetchApi: jest.Mocked<FetchApi> = {
    fetch: jest.fn(),
  };
  const auth = mockServices.auth();
  const discovery = mockServices.discovery();
  const treeResponseFactory: jest.Mocked<ReadTreeResponseFactory> = {
    fromReadableArray: jest.fn(),
    fromTarArchive: jest.fn(),
    fromZipArchive: jest.fn(),
  };
  const sut = new AdpOnboardingUrlReader({
    config,
    fetchApi,
    auth,
    discovery,
    treeResponseFactory,
  });
  return { sut, config, fetchApi, auth, discovery, treeResponseFactory };
}
