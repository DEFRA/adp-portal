import { AdpDbModelEntityProvider } from './AdpDbModelEntityProvider';
import { TaskInvocationDefinition, PluginTaskScheduler, TaskRunner } from '@backstage/backend-tasks';
import { PluginDatabaseManager } from '@backstage/backend-common';
import { ConfigReader } from '@backstage/config';
import { getVoidLogger } from '@backstage/backend-common';
import { EntityProviderConnection } from '@backstage/plugin-catalog-node';

describe('AdpDbModelEntityProvider', () => {
  const mockConfig = new ConfigReader({
    catalog: {
      providers: {
        adpDb: {
          baseUrl: 'http://adpdb:8080',
          schedule: {
            frequency: {
              minutes: 10,
            },
            timeout: {
              minutes: 10,
            },
          },
        },
      },
    },
  });

  class PersistingTaskRunner implements TaskRunner {
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
  const mockTaskRunner = { run: jest.fn() } as unknown as TaskRunner;
  const mockDatabaseManager = {} as PluginDatabaseManager;
  const mockScheduler = {} as PluginTaskScheduler;
  const mockSchedule = new PersistingTaskRunner();

  jest.mock('../armsLengthBody/armsLengthBodyStore', () => ({
    ArmsLengthBodyStore: jest.fn().mockImplementation(() => ({
      getAll: jest.fn().mockResolvedValue([
        {
          creator: 'Seed',
          owner: 'Seed',
          title: 'Environment Agency',
          short_name: 'EA',
          description: '',
          url: null,
          name: 'environment-agency',
          id: '4b5c98c3-94fb-444e-8d9b-ebe71ac4d5f3',
          timestamp: '2024-02-05T11:29:33.059Z',
        },
      ]),
    })),
  }));

  jest.mock('../database/adpDatabase', () => ({
    AdpDatabase: {
      create: jest.fn().mockResolvedValue({
        creator: 'Seed',
        owner: 'Seed',
        title: 'Environment Agency',
        short_name: 'EA',
        description: '',
        url: null,
        name: 'environment-agency',
        id: '4b5c98c3-94fb-444e-8d9b-ebe71ac4d5f3',
        timestamp: '2024-02-05T11:29:33.059Z',
      }),
    },
  }));

  describe('fromConfig', () => {
    it('initializes correctly from configuration', () => {
      const options = {
        logger: logger,
        schedule: mockSchedule,
        scheduler: mockScheduler,
        database: mockDatabaseManager,
      };
      const entityProvider = AdpDbModelEntityProvider.fromConfig(
        mockConfig,
        options,
      );
      expect(entityProvider).toBeDefined();
    });

    it('throws an error if neither schedule nor scheduler is provided', () => {
      const options = {
        logger: logger,
        schedule: undefined,
        scheduler: mockScheduler,
        database: mockDatabaseManager,
      };
      expect(() =>
        AdpDbModelEntityProvider.fromConfig(mockConfig, options),
      ).toThrow();
    });
  });

  describe('connect and refresh', () => {
    it('connects and schedules refresh successfully', async () => {
      const entityProvider = new AdpDbModelEntityProvider(
        logger,
        mockTaskRunner,
        mockConfig,
        mockDatabaseManager,
      );
      const mockConnection: EntityProviderConnection = {
        applyMutation: jest.fn(),
        refresh: jest.fn(),
      };
      await entityProvider.connect(mockConnection);
      expect(mockTaskRunner.run).toHaveBeenCalledWith({
        id: expect.any(String),
        fn: expect.any(Function),
      });
    });
  });
});
