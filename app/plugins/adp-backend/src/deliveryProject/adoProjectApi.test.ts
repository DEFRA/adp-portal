import { ConfigReader } from '@backstage/config';
import { AdoProjectApi } from './adoProjectApi';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';

describe('AdoProjectApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it('initializes correctly from required parameters', () => {
    const adoProjectApi = new AdoProjectApi(mockConfig, mockFetchApi);
    expect(adoProjectApi).toBeDefined();
  });

  it('should return true if ADO project exists', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    } as unknown as Response);
    const adoProjectApi = new AdoProjectApi(mockConfig, mockFetchApi);

    const result = await adoProjectApi.checkIfAdoProjectExists('test-project');

    expect(result).toBeTruthy();
  });

  it('should return false if ADO project doesnt exists', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'NOT FOUND',
    } as unknown as Response);
    const adoProjectApi = new AdoProjectApi(mockConfig, mockFetchApi);

    await expect(
      adoProjectApi.checkIfAdoProjectExists('test-project'),
    ).rejects.toThrow(/Failed to fetch ADO Project details for project/);
  });
});
