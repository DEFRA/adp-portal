import { ConfigReader } from '@backstage/config';
import { FluxConfigApi } from './fluxConfigApi';
import { expectedProgrammeDataWithManager } from '../testData/programmeTestData';
import { DeliveryProgrammeStore } from '../deliveryProgramme/deliveryProgrammeStore';
import type { Response } from 'node-fetch';
import fetch from 'node-fetch';
import type { DeliveryProject } from '@internal/plugin-adp-common';

jest.mock('node-fetch', () => jest.fn());
const mockedFetch: jest.MockedFunction<typeof fetch> =
  fetch as jest.MockedFunction<typeof fetch>;

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockConfig = new ConfigReader({
    adp: {
      fluxOnboarding: {
        apiBaseUrl: 'https://portal-api/FluxOnboarding',
      },
    },
  });

  it('initializes correctly from required parameters', () => {
    const mockDeliveryProgrammeStore = new DeliveryProgrammeStore(null!);
    const fluxConfigApi = new FluxConfigApi(
      mockConfig,
      mockDeliveryProgrammeStore,
    );

    expect(fluxConfigApi).toBeDefined();
  });

  it('should get Flux team configuration', async () => {
    mockedFetch.mockResolvedValue({
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
        ],
      }),
      ok: true,
      status: 200,
    } as unknown as Response);

    const mockDeliveryProgrammeStore = new DeliveryProgrammeStore(null!);
    const fluxConfigApi = new FluxConfigApi(
      mockConfig,
      mockDeliveryProgrammeStore,
    );
    const fluxTeamConfig = await fluxConfigApi.getFluxConfig('test-team');

    expect(fluxTeamConfig).toBeDefined();
    expect(fluxTeamConfig?.teamName).toBe('test-team');
  });

  it('should return null if Flux team configuration is not found', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      status: 404,
    } as unknown as Response);

    const mockDeliveryProgrammeStore = new DeliveryProgrammeStore(null!);
    const fluxConfigApi = new FluxConfigApi(
      mockConfig,
      mockDeliveryProgrammeStore,
    );
    const fluxTeamConfig = await fluxConfigApi.getFluxConfig('test-team');

    expect(fluxTeamConfig).toBeNull();
  });

  it('should throw if a non-success response is received when getting team configuration', async () => {
    mockedFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Something went wrong',
    } as unknown as Response);

    const mockDeliveryProgrammeStore = new DeliveryProgrammeStore(null!);
    const fluxConfigApi = new FluxConfigApi(
      mockConfig,
      mockDeliveryProgrammeStore,
    );

    await expect(fluxConfigApi.getFluxConfig('test-team')).rejects.toThrow(
      /Unexpected response from FluxConfig API/,
    );
  });

  it('should create Flux team configuration', async () => {
    mockedFetch.mockResolvedValue({
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
    };

    const mockDeliveryProgrammeStore = new DeliveryProgrammeStore(null!);
    const fluxConfigApi = new FluxConfigApi(
      mockConfig,
      mockDeliveryProgrammeStore,
    );
    await fluxConfigApi.createFluxConfig(deliveryProject);

    expect(fetch).toHaveBeenCalled();
  });

  it('should create Flux team configuration with config variables', async () => {
    mockedFetch.mockResolvedValue({
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
    };

    const mockDeliveryProgrammeStore = new DeliveryProgrammeStore(null!);
    const fluxConfigApi = new FluxConfigApi(
      new ConfigReader({
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
      mockDeliveryProgrammeStore,
    );
    await fluxConfigApi.createFluxConfig(deliveryProject);

    expect(fetch).toHaveBeenCalled();
  });

  it('should throw if a non-success response is received when creating team configuration', async () => {
    mockedFetch.mockResolvedValue({
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
    };

    const mockDeliveryProgrammeStore = new DeliveryProgrammeStore(null!);
    const fluxConfigApi = new FluxConfigApi(
      mockConfig,
      mockDeliveryProgrammeStore,
    );

    await expect(
      fluxConfigApi.createFluxConfig(deliveryProject),
    ).rejects.toThrow(/Unexpected response from FluxConfig API/);
  });
});
