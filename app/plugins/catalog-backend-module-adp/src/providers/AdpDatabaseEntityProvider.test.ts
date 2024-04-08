import { getVoidLogger } from '@backstage/backend-common';
import {
  PluginTaskScheduler,
  TaskInvocationDefinition,
  TaskRunner,
} from '@backstage/backend-tasks';
import { AdpDatabaseEntityProvider } from './AdpDatabaseEntityProvider';
import { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import fetch, { Response } from 'node-fetch';
import { DiscoveryService } from '@backstage/backend-plugin-api';

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

  it('initializes correctly from required parameters', () => {
    const options = {
      logger: logger,
      schedule: mockSchedule,
      scheduler: mockScheduler,
    };

    const entityProvider = AdpDatabaseEntityProvider.create(
      mockDiscoveryService,
      options,
    );

    expect(entityProvider).toBeDefined();
  });

  it('throws an error if a schedule is not provided', () => {
    const options = {
      logger: logger,
      schedule: null!,
      scheduler: null!,
    };
    expect(() =>
      AdpDatabaseEntityProvider.create(mockDiscoveryService, options),
    ).toThrow(/Either schedule or scheduler must be provided./);
  });

  it('returns the entity provider name', () => {
    const options = {
      logger: logger,
      schedule: mockSchedule,
      scheduler: mockScheduler,
    };

    const entityProvider = AdpDatabaseEntityProvider.create(
      mockDiscoveryService,
      options,
    );

    expect(entityProvider.getProviderName()).toBe(
      AdpDatabaseEntityProvider.name,
    );
  });

  it('applies a full update on scheduled execution', async () => {
    const options = {
      logger: logger,
      schedule: mockSchedule,
      scheduler: mockScheduler,
    };
    const entityProviderConnection: EntityProviderConnection = {
      applyMutation: jest.fn(),
      refresh: jest.fn(),
    };

    mockedFetch.mockResolvedValue({
      json: jest.fn().mockResolvedValue([
        {
          id: '1111',
          timestamp: new Date(),
          creator: 'test@test.com',
          owner: 'test@test.com',
          name: 'test-alb-1',
          alias: 'TA1',
          description: 'Test description 1',
          url: 'https://test1.com',
          title: 'Test ALB 1',
        },
        {
          id: '2222',
          timestamp: new Date(),
          creator: 'test@test.com',
          owner: 'test@test.com',
          name: 'test-alb-2',
          alias: 'TA2',
          description: 'Test description 2',
          url: 'https://test2.com',
          title: 'Test ALB 2',
        },
      ]),
      ok: jest.fn().mockImplementation(() => true),
    } as unknown as Response);

    const entityProvider = AdpDatabaseEntityProvider.create(
      mockDiscoveryService,
      options,
    );

    await entityProvider.connect(entityProviderConnection);

    const taskDef = mockSchedule.getTasks()[0];
    expect(taskDef.id).toEqual(`${entityProvider.getProviderName()}:refresh`);

    await (taskDef.fn as () => Promise<void>)();

    const expectedEntities = [
      {
        entity: {
          apiVersion: 'backstage.io/v1beta1',
          kind: 'Group',
          metadata: {
            name: 'test-alb-1',
            title: 'Test ALB 1 (TA1)',
            description: 'Test description 1',
            tags: [],
            annotations: {
              'backstage.io/managed-by-location':
                'adp:arms-length-body\\test-alb-1',
              'backstage.io/managed-by-origin-location':
                'adp:arms-length-body\\test-alb-1',
            },
            links: [{ url: 'https://test1.com' }],
          },
          spec: {
            type: 'arms-length-body',
            children: [],
          },
        },
        locationKey: entityProvider.getProviderName(),
      },
      {
        entity: {
          apiVersion: 'backstage.io/v1beta1',
          kind: 'Group',
          metadata: {
            name: 'test-alb-2',
            title: 'Test ALB 2 (TA2)',
            description: 'Test description 2',
            tags: [],
            annotations: {
              'backstage.io/managed-by-location':
                'adp:arms-length-body\\test-alb-2',
              'backstage.io/managed-by-origin-location':
                'adp:arms-length-body\\test-alb-2',
            },
            links: [{ url: 'https://test2.com' }],
          },
          spec: {
            type: 'arms-length-body',
            children: [],
          },
        },
        locationKey: entityProvider.getProviderName(),
      },
    ];

    expect(entityProviderConnection.applyMutation).toHaveBeenCalledTimes(1);
    expect(entityProviderConnection.applyMutation).toHaveBeenCalledWith({
      type: 'full',
      entities: expectedEntities,
    });
  });
});
