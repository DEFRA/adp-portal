import { mockServices } from '@backstage/backend-test-utils';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { AdpOnboardingUrlReader } from './AdpOnboardingUrlReader';
import type { ReadTreeResponseFactory } from '@backstage/backend-defaults/dist/urlReader';

describe('AdpOnboardingUrlReader', () => {
  describe('readUrl', () => {
    it('Should error when trying to read any url it does not support', async () => {
      const { sut } = setup();

      const test = () => sut.readUrl('http://some-other-site.com');

      await expect(test).rejects.toThrow(
        'Unsupported url http://some-other-site.com',
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
