import { getVoidLogger } from '@backstage/backend-common';
import {
  PluginTaskScheduler,
  TaskInvocationDefinition,
  TaskRunner,
} from '@backstage/backend-tasks';
import { AdpDatabaseEntityProvider } from './AdpDatabaseEntityProvider';
import { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import { DiscoveryService } from '@backstage/backend-plugin-api';
import {
  mockAlbTransformerData,
  mockProgrammeTransformerData,
  mockProjectTransformerData,
} from '../testData/entityProviderTestData';

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

const logger = getVoidLogger();

describe('AdbDatabaseEntityProvider', () => {
  const mockScheduler = {} as PluginTaskScheduler;
  const mockSchedule = new MockTaskRunner();
  const mockDiscoveryService: DiscoveryService = {
    getBaseUrl: jest.fn().mockResolvedValue('http://localhost:123/api/adp'),
    getExternalBaseUrl: jest.fn(),
  };
  let options = {
    logger: logger,
    schedule: mockSchedule,
    scheduler: mockScheduler,
  };
  const entityProvider = AdpDatabaseEntityProvider.create(
    mockDiscoveryService,
    options,
  );

  it('initializes correctly from required parameters', () => {
    expect(entityProvider).toBeDefined();
  });

  it('throws an error if a schedule is not provided', () => {
    const optionsWithoutSchedule = {
      logger: logger,
      schedule: null!,
      scheduler: null!,
    };
    expect(() =>
      AdpDatabaseEntityProvider.create(mockDiscoveryService, optionsWithoutSchedule),
    ).toThrow(/Either schedule or scheduler must be provided./);
  });

  it('throws an error if connection is not intialized', () => {
    expect(entityProvider['refresh'](options.logger)).rejects.toThrow(
      `ADP Data Model discovery connection not initialized for ${entityProvider.getProviderName()}`,
    );
  });

  it('returns the entity provider name', () => {
    const entityProvider = AdpDatabaseEntityProvider.create(
      mockDiscoveryService,
      options,
    );

    expect(entityProvider.getProviderName()).toBe(
      AdpDatabaseEntityProvider.name,
    );
  });

  it('applies a full update on scheduled execution', async () => {
    const entityProviderConnection: EntityProviderConnection = {
      applyMutation: jest.fn(),
      refresh: jest.fn(),
    };

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
    const loggerSpy = jest.spyOn(options.logger, 'info');
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
    expect(loggerSpy).toHaveBeenCalledWith(
      'Discovering ADP Data Model Entities',
    );
  });
});
