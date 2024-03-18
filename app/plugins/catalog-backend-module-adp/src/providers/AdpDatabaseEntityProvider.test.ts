import { getVoidLogger } from '@backstage/backend-common';
import {
  PluginTaskScheduler,
  TaskInvocationDefinition,
  TaskRunner,
} from '@backstage/backend-tasks';
import { AdpDatabaseEntityProvider } from './AdpDatabaseEntityProvider';

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

describe('AdbDatabaseEntityProvider', () => {
  const mockScheduler = {} as PluginTaskScheduler;
  const mockSchedule = new MockTaskRunner();
  const mockDiscoveryService = {
    getBaseUrl: jest.fn(),
    getExternalBaseUrl: jest.fn(),
  };
  const logger = getVoidLogger();

  describe('create', () => {
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
        schedule: undefined,
        scheduler: mockScheduler,
      };
      expect(() => AdpDatabaseEntityProvider.create(mockDiscoveryService, options, )).toThrow();
    });
  });
});
