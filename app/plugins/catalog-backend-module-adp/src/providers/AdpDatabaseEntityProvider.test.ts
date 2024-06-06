import type {
  PluginTaskScheduler,
  TaskInvocationDefinition,
  TaskRunner,
} from '@backstage/backend-tasks';
import { AdpDatabaseEntityProvider } from './AdpDatabaseEntityProvider';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import {
  armsLengthBody,
  deliveryProgramme,
  deliveryProject,
  mockAlbTransformerData,
  mockProgrammeTransformerData,
  mockProjectTransformerData,
} from '../testData/entityProviderTestData';
import { deliveryProgrammeAdmins } from '../testData/programmeTransformerTestData';
import { deliveryProjectUsers } from '../testData/projectTransformerTestData';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { mockServices } from '@backstage/backend-test-utils';

class MockTaskRunner implements TaskRunner {
  private tasks: TaskInvocationDefinition[] = [];

  getTasks() {
    return this.tasks;
  }

  run(task: TaskInvocationDefinition): Promise<void> {
    this.tasks.push(task);
    return Promise.resolve(undefined);
  }
}

function createLoggerMock() {
  return {
    child: jest.fn().mockImplementation(createLoggerMock),
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

describe('AdbDatabaseEntityProvider', () => {
  function setup() {
    const mockLogger = mockServices.logger.mock(createLoggerMock());
    const mockScheduler = {} as PluginTaskScheduler;
    const mockSchedule = new MockTaskRunner();
    const mockFetchApi: jest.Mocked<FetchApi> = {
      fetch: jest.fn(),
    };
    const mockDiscoveryService = mockServices.discovery.mock({
      getBaseUrl: jest.fn().mockResolvedValue('http://localhost:123/api/adp'),
    });

    const options = {
      logger: mockLogger,
      fetchApi: mockFetchApi,
      schedule: mockSchedule,
      scheduler: mockScheduler,
    };

    const entityProvider = AdpDatabaseEntityProvider.create(
      mockDiscoveryService,
      options,
    );

    const entityProviderConnection: EntityProviderConnection = {
      applyMutation: jest.fn(),
      refresh: jest.fn(),
    };

    return {
      entityProvider,
      entityProviderConnection,
      mockLogger,
      mockSchedule,
      mockFetchApi,
      mockDiscoveryService,
    };
  }

  it('initializes correctly from required parameters', () => {
    const { entityProvider } = setup();
    expect(entityProvider).toBeDefined();
  });

  it('throws an error if a schedule is not provided', () => {
    const { mockFetchApi, mockLogger, mockDiscoveryService } = setup();
    const optionsWithoutSchedule = {
      logger: mockLogger,
      fetchApi: mockFetchApi,
      schedule: null!,
      scheduler: null!,
    };
    expect(() =>
      AdpDatabaseEntityProvider.create(
        mockDiscoveryService,
        optionsWithoutSchedule,
      ),
    ).toThrow(/Either schedule or scheduler must be provided./);
  });

  it('returns the entity provider name', () => {
    const { entityProvider } = setup();
    expect(entityProvider.getProviderName()).toBe(
      AdpDatabaseEntityProvider.name,
    );
  });

  it('applies a full update on scheduled execution', async () => {
    const { entityProvider, entityProviderConnection, mockSchedule } = setup();

    await entityProvider.connect(entityProviderConnection);

    jest
      .spyOn(entityProvider as any, 'readArmsLengthBodies')
      .mockResolvedValueOnce(mockAlbTransformerData);
    jest
      .spyOn(entityProvider as any, 'readDeliveryProgrammes')
      .mockResolvedValueOnce(mockProgrammeTransformerData);
    jest
      .spyOn(entityProvider as any, 'readDeliveryProjects')
      .mockResolvedValueOnce(mockProjectTransformerData);

    const taskDef = mockSchedule.getTasks()[0];
    expect(taskDef.id).toEqual(`${entityProvider.getProviderName()}:refresh`);

    await (taskDef.fn as () => Promise<void>)();

    const expectedEntities = [
      {
        entity: mockAlbTransformerData[0],
        locationKey: entityProvider.getProviderName(),
      },
      {
        entity: mockAlbTransformerData[1],
        locationKey: entityProvider.getProviderName(),
      },
      {
        entity: mockProgrammeTransformerData[0],
        locationKey: entityProvider.getProviderName(),
      },
      {
        entity: mockProgrammeTransformerData[1],
        locationKey: entityProvider.getProviderName(),
      },
      {
        entity: mockProjectTransformerData[0],
        locationKey: entityProvider.getProviderName(),
      },
      {
        entity: mockProjectTransformerData[1],
        locationKey: entityProvider.getProviderName(),
      },
    ];

    expect(entityProviderConnection.applyMutation).toHaveBeenCalledTimes(1);
    expect(entityProviderConnection.applyMutation).toHaveBeenCalledWith({
      type: 'full',
      entities: expectedEntities,
    });
  });

  it('successfully runs readArmsLengthBodies', async () => {
    const {
      entityProvider,
      entityProviderConnection,
      mockFetchApi,
      mockLogger,
    } = setup();

    mockFetchApi.fetch.mockResolvedValue(
      mockResponse({
        ok: true,
        json: jest.fn().mockResolvedValue(armsLengthBody),
      }),
    );

    await entityProvider.connect(entityProviderConnection);

    const response = await (entityProvider as any).readArmsLengthBodies(
      mockLogger,
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Discovering all Arms Length Bodies'),
    );
    expect(mockFetchApi.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/armslengthbody'),
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response).toEqual(mockAlbTransformerData);
  });

  it('successfully runs readDeliveryProgrammes', async () => {
    const {
      entityProvider,
      entityProviderConnection,
      mockFetchApi,
      mockLogger,
    } = setup();

    mockFetchApi.fetch.mockResolvedValue(
      mockResponse({
        json: jest
          .fn()
          .mockResolvedValueOnce(deliveryProgramme)
          .mockResolvedValueOnce(deliveryProgrammeAdmins),
        ok: true,
      }),
    );

    await entityProvider.connect(entityProviderConnection);

    const response = await (entityProvider as any).readDeliveryProgrammes(
      mockLogger,
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Discovering all Delivery Programmes'),
    );
    expect(mockFetchApi.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/deliveryProgramme'),
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response).toEqual(mockProgrammeTransformerData);
  });

  it('successfully runs readDeliveryProjects', async () => {
    const {
      entityProvider,
      entityProviderConnection,
      mockFetchApi,
      mockLogger,
    } = setup();

    mockFetchApi.fetch.mockResolvedValue(
      mockResponse({
        json: jest
          .fn()
          .mockResolvedValueOnce(deliveryProject)
          .mockResolvedValueOnce(deliveryProjectUsers),
        ok: true,
      }),
    );

    await entityProvider.connect(entityProviderConnection);

    const response = await (entityProvider as any).readDeliveryProjects(
      mockLogger,
    );
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('Discovering all Delivery Projects'),
    );
    expect(mockFetchApi.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/deliveryProject'),
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response).toEqual(mockProjectTransformerData);
  });
});

function mockResponse(properties: Partial<Response>): Response {
  return properties as Response;
}
