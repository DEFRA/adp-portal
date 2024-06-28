import { ConfigReader } from '@backstage/config';
import { AdoProjectApi } from './adoProjectApi';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import type { TokenProvider } from '@internal/plugin-credentials-context-backend';
import { randomUUID } from 'node:crypto';

describe('AdoProjectApi', () => {
  const mockConfig = new ConfigReader({
    adp: {
      adoProject: {
        apiBaseUrl: 'https://portal-api/AdoProject',
      },
    },
  });

  const mockFetchApi: jest.Mocked<FetchApi> = {
    fetch: jest.fn(),
  };

  const mockTokens: jest.Mocked<TokenProvider> = {
    getLimitedUserToken: jest.fn(),
    getPluginRequestToken: jest.fn(),
  };

  function sut() {
    return new AdoProjectApi({
      config: mockConfig,
      fetchApi: mockFetchApi,
      tokens: mockTokens,
    });
  }
  beforeEach(() => {
    jest.clearAllMocks();
    mockTokens.getLimitedUserToken.mockResolvedValue({
      token: randomUUID(),
      expiresAt: new Date(),
    });
  });

  it('initializes correctly from required parameters', () => {
    const adoProjectApi = sut();
    expect(adoProjectApi).toBeDefined();
  });

  it('should return true if ADO project exists', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as unknown as Response);
    const adoProjectApi = sut();

    const result = await adoProjectApi.checkIfAdoProjectExists('test-project');

    expect(result).toBeTruthy();
  });

  it('should return false if ADO project doesnt exists', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'NOT FOUND',
    } as unknown as Response);
    const adoProjectApi = sut();

    await expect(
      adoProjectApi.checkIfAdoProjectExists('test-project'),
    ).rejects.toThrow(/Failed to fetch ADO Project details for project/);
  });
});
