import { ConfigReader } from '@backstage/config';
import { FluxConfigApi, type FluxConfigApiOptions } from './fluxConfigApi';
import { expectedProgrammeDataWithManager } from '../testData/programmeTestData';
import { DeliveryProgrammeStore } from '../deliveryProgramme/deliveryProgrammeStore';
import type { DeliveryProject } from '@internal/plugin-adp-common';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import type { TokenProvider } from '@internal/plugin-credentials-context-backend';
import { randomUUID } from 'node:crypto';

let mockProgrammeGetAll: jest.Mock;
let mockProgrammeGet: jest.Mock;
let mockProgrammeAdd: jest.Mock;
let mockProgrammeUpdate: jest.Mock;

jest.mock('../deliveryProgramme/deliveryProgrammeStore', () => {
  return {
    DeliveryProgrammeStore: jest.fn().mockImplementation(() => {
      mockProgrammeGetAll = jest
        .fn()
        .mockResolvedValue([expectedProgrammeDataWithManager]);
      mockProgrammeGet = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithManager);
      mockProgrammeAdd = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithManager);
      mockProgrammeUpdate = jest
        .fn()
        .mockResolvedValue(expectedProgrammeDataWithManager);

      return {
        getAll: mockProgrammeGetAll,
        get: mockProgrammeGet,
        add: mockProgrammeAdd,
        update: mockProgrammeUpdate,
      };
    }),
  };
});

describe('FluxConfigApi', () => {
  const mockConfig = new ConfigReader({
    adp: {
      fluxOnboarding: {
        apiBaseUrl: 'https://portal-api/FluxOnboarding',
      },
    },
  });

  const mockFetchApi: jest.Mocked<FetchApi> = {
    fetch: jest.fn(),
  };

  const mockDeliveryProgrammeStore = new DeliveryProgrammeStore(null!);
  const mockTokens: jest.Mocked<TokenProvider> = {
    getLimitedUserToken: jest.fn(),
    getPluginRequestToken: jest.fn(),
  };

  function sut(options?: Partial<FluxConfigApiOptions>) {
    return new FluxConfigApi({
      config: mockConfig,
      deliveryProgrammeStore: mockDeliveryProgrammeStore,
      fetchApi: mockFetchApi,
      tokens: mockTokens,
      ...options,
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
    const fluxConfigApi = sut();

    expect(fluxConfigApi).toBeDefined();
  });

  it('should get Flux team configuration', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        serviceCode: 'test',
        programmeName: 'test',
        teamName: 'test-team',
        services: [
          {
            name: 'test-web',
            type: 0,
            environments: [
              {
                name: 'ENV1',
                configVariables: [],
              },
              {
                name: 'ENV2',
                configVariables: [],
              },
            ],
            configVariables: [
              {
                key: 'CONFIG_1',
                value: 'ffc-demo-web',
              },
            ],
          },
        ],
        configVariables: [
          {
            key: 'TEAM_CPU_QUOTA',
            value: '2000',
          },
          {
            key: 'TEAM_MEMORY_QUOTA',
            value: '3000Mi',
          },
          {
            key: 'TEAM_PODS_QUOTA',
            value: '20',
          },
          {
            key: 'CONTAINER_MAX_CPU',
            value: '500m',
          },
          {
            key: 'CONTAINER_MAX_MEMORY',
            value: '1000Mi',
          },
        ],
      }),
      ok: true,
      status: 200,
    } as unknown as Response);

    const fluxConfigApi = sut();
    const fluxTeamConfig = await fluxConfigApi.getFluxConfig('test-team');

    expect(fluxTeamConfig).toBeDefined();
    expect(fluxTeamConfig?.teamName).toBe('test-team');
  });

  it('should return null if Flux team configuration is not found', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      status: 404,
    } as unknown as Response);

    const fluxConfigApi = sut();
    const fluxTeamConfig = await fluxConfigApi.getFluxConfig('test-team');

    expect(fluxTeamConfig).toBeNull();
  });

  it('should throw if a non-success response is received when getting team configuration', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Something went wrong',
    } as unknown as Response);

    const fluxConfigApi = sut();

    await expect(fluxConfigApi.getFluxConfig('test-team')).rejects.toThrow(
      /Unexpected response from FluxConfig API/,
    );
  });

  it('should create Flux team configuration', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      status: 204,
    } as unknown as Response);

    const deliveryProject: DeliveryProject = {
      name: 'test-project',
      id: '123-456',
      title: 'Test Project',
      description: 'Test Project',
      delivery_programme_id: '123',
      delivery_project_code: '123',
      created_at: new Date(),
      updated_at: new Date(),
      namespace: 'test-namespace',
      service_owner: 'owner@test.com',
      team_type: 'test',
      ado_project: 'TEST-ADO',
      delivery_programme_code: 'ABC',
      delivery_project_users: [],
      delivery_programme_admins: [],
    };

    const fluxConfigApi = sut();
    await fluxConfigApi.createFluxConfig(deliveryProject);

    expect(mockFetchApi.fetch).toHaveBeenCalled();
  });

  it('should create Flux team configuration with config variables', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      status: 204,
    } as unknown as Response);

    const deliveryProject: DeliveryProject = {
      name: 'test-project',
      id: '123-456',
      title: 'Test Project',
      description: 'Test Project',
      delivery_programme_id: '123',
      delivery_project_code: '123',
      created_at: new Date(),
      updated_at: new Date(),
      namespace: 'test-namespace',
      service_owner: 'owner@test.com',
      team_type: 'test',
      ado_project: 'TEST-ADO',
      delivery_programme_code: 'ABC',
      delivery_project_users: [],
      delivery_programme_admins: [],
    };

    const fluxConfigApi = sut({
      config: new ConfigReader({
        adp: {
          fluxOnboarding: {
            apiBaseUrl: 'https://portal-api/FluxOnboarding',
            defaultConfigVariables: [
              {
                key: 'MyConfigVariable',
                value: 'MyConfigValue',
              },
            ],
          },
        },
      }),
    });
    await fluxConfigApi.createFluxConfig(deliveryProject);

    expect(mockFetchApi.fetch).toHaveBeenCalled();
  });

  it('should throw if a non-success response is received when creating team configuration', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Something went wrong',
    } as unknown as Response);

    const deliveryProject: DeliveryProject = {
      name: 'test-project',
      id: '123-456',
      title: 'Test Project',
      description: 'Test Project',
      delivery_programme_id: '123',
      delivery_project_code: '123',
      created_at: new Date(),
      updated_at: new Date(),
      namespace: 'test-namespace',
      service_owner: 'owner@test.com',
      team_type: 'test',
      ado_project: 'TEST-ADO',
      delivery_programme_code: 'ABC',
      delivery_project_users: [],
      delivery_programme_admins: [],
    };

    const fluxConfigApi = sut();

    await expect(
      fluxConfigApi.createFluxConfig(deliveryProject),
    ).rejects.toThrow(/Unexpected response from FluxConfig API/);
  });
});
