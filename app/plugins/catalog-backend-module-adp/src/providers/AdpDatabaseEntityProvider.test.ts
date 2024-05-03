import { getVoidLogger } from '@backstage/backend-common';
import type {
  PluginTaskScheduler,
  TaskInvocationDefinition,
  TaskRunner,
} from '@backstage/backend-tasks';
import { AdpDatabaseEntityProvider } from './AdpDatabaseEntityProvider';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import type { DiscoveryService } from '@backstage/backend-plugin-api';
import {
  armsLengthBody,
  deliveryProgramme,
  deliveryProject,
  mockAlbTransformerData,
  mockProgrammeTransformerData,
  mockProjectTransformerData,
} from '../testData/entityProviderTestData';
import type { Response } from 'node-fetch';
import fetch from 'node-fetch';

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

jest.mock('node-fetch', () => jest.fn());
const mockedFetch: jest.MockedFunction<typeof fetch> =
  fetch as jest.MockedFunction<typeof fetch>;

const logger = getVoidLogger();

describe('AdbDatabaseEntityProvider', () => {
  const mockScheduler = {} as PluginTaskScheduler;
  const mockSchedule = new MockTaskRunner();
  const mockDiscoveryService: DiscoveryService = {
    getBaseUrl: jest.fn().mockResolvedValue('http://localhost:123/api/adp'),
    getExternalBaseUrl: jest.fn(),
  };

  const options = {
    logger: logger,
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
      AdpDatabaseEntityProvider.create(
        mockDiscoveryService,
        optionsWithoutSchedule,
      ),
    ).toThrow(/Either schedule or scheduler must be provided./);
  });

  it('returns the entity provider name', () => {
    expect(entityProvider.getProviderName()).toBe(
      AdpDatabaseEntityProvider.name,
    );
  });

  it('applies a full update on scheduled execution', async () => {
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
      'Discovering ADP Onboarding Model Entities',
    );
  });

  it('successfully runs readArmsLengthBodies', async () => {
    mockedFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(armsLengthBody),
      ok: jest.fn().mockImplementation(() => true),
    } as unknown as Response);

    await entityProvider.connect(entityProviderConnection);

    const response = await (entityProvider as any).readArmsLengthBodies(
      options.logger,
    );
    expect(options.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Discovering all Arms Length Bodies'),
    );
    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/armslengthbody'),
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response).toEqual(mockAlbTransformerData);
  });

  it('successfully runs readDeliveryProgrammes', async () => {
    mockedFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(deliveryProgramme),
      ok: jest.fn().mockImplementation(() => true),
    } as unknown as Response);

    await entityProvider.connect(entityProviderConnection);

    const response = await (entityProvider as any).readDeliveryProgrammes(
      options.logger,
    );
    expect(options.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Discovering all Delivery Programmes'),
    );
    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/deliveryProgramme'),
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response).toEqual(mockProgrammeTransformerData);
  });

  it('successfully runs readDeliveryProjects', async () => {
    mockedFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue(deliveryProject),
      ok: jest.fn().mockImplementation(() => true),
    } as unknown as Response);

    await entityProvider.connect(entityProviderConnection);

    const response = await (entityProvider as any).readDeliveryProjects(
      options.logger,
    );
    expect(options.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('Discovering all Delivery Projects'),
    );
    expect(mockedFetch).toHaveBeenCalledWith(
      expect.stringContaining('/deliveryProject'),
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response).toEqual(mockProjectTransformerData);
  });
});
