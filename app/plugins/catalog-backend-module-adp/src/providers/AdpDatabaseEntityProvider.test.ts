import type { TaskRunner } from '@backstage/backend-tasks';
import { AdpDatabaseEntityProvider } from './AdpDatabaseEntityProvider';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import type {
  AuthService,
  DiscoveryService,
  SchedulerService,
} from '@backstage/backend-plugin-api';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import type * as AdpDatabaseEntityProviderConnection from './AdpDatabaseEntityProviderConnection';
import { mockServices } from '@backstage/backend-test-utils';

type AdpDatabaseEntityProviderConnectionClass =
  (typeof AdpDatabaseEntityProviderConnection)['AdpDatabaseEntityProviderConnection'];
type AdpDatabaseEntityProviderConnectionInstance = {
  [P in keyof InstanceType<AdpDatabaseEntityProviderConnectionClass>]: InstanceType<AdpDatabaseEntityProviderConnectionClass>[P];
};
type AdpDatabaseEntityProviderConnectionCtor =
  new () => AdpDatabaseEntityProviderConnectionInstance;

const mockAdpDatabaseEntityProviderConnectionCtor: jest.MockedClass<AdpDatabaseEntityProviderConnectionCtor> =
  jest.fn();
const mockAdpDatabaseEntityProviderConnectionInstance: jest.Mocked<AdpDatabaseEntityProviderConnectionInstance> =
  {
    refresh: jest.fn(),
  };
jest.mock('./AdpDatabaseEntityProviderConnection', () => ({
  ...jest.requireActual('./AdpDatabaseEntityProviderConnection'),
  get AdpDatabaseEntityProviderConnection() {
    return mockAdpDatabaseEntityProviderConnectionCtor;
  },
}));

function createLoggerMock() {
  return {
    child: jest.fn().mockImplementation(createLoggerMock),
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

describe('AdpDatabaseEntityProvider', () => {
  function setup() {
    const logger = mockServices.logger.mock(createLoggerMock());
    const fetchApi: jest.Mocked<FetchApi> = {
      fetch: jest.fn(),
    };
    const authService: jest.Mocked<AuthService> = {
      authenticate: jest.fn(),
      getLimitedUserToken: jest.fn(),
      getNoneCredentials: jest.fn(),
      getOwnServiceCredentials: jest.fn(),
      getPluginRequestToken: jest.fn(),
      isPrincipal: jest.fn() as any,
      listPublicServiceKeys: jest.fn(),
    };
    const discoveryService: jest.Mocked<DiscoveryService> = {
      getBaseUrl: jest.fn().mockResolvedValue('http://localhost:123/api/adp'),
      getExternalBaseUrl: jest.fn(),
    };
    const schedule: jest.Mocked<TaskRunner> = {
      run: jest.fn(),
    };
    const scheduler: jest.Mocked<SchedulerService> = {
      createScheduledTaskRunner: jest.fn(),
      getScheduledTasks: jest.fn(),
      scheduleTask: jest.fn(),
      triggerTask: jest.fn(),
    };
    const connection: jest.Mocked<EntityProviderConnection> = {
      applyMutation: jest.fn(),
      refresh: jest.fn(),
    };
    return {
      logger,
      fetchApi,
      authService,
      discoveryService,
      scheduler,
      schedule,
      connection,
      get sut() {
        return AdpDatabaseEntityProvider.create({
          discovery: discoveryService,
          auth: authService,
          logger,
          fetchApi,
          schedule,
        });
      },
    };
  }

  describe('#getProviderName', () => {
    it('Should return the provider name', () => {
      const { sut } = setup();
      expect(sut.getProviderName()).toBe(AdpDatabaseEntityProvider.name);
    });
  });

  describe('#create', () => {
    it('Should create the provider if all arguments are provided', () => {
      const { sut } = setup();
      expect(sut).toBeDefined();
    });
    it('Should throw an error if a schedule is not provided', () => {
      const { logger, fetchApi, authService, discoveryService } = setup();
      expect(() =>
        AdpDatabaseEntityProvider.create({
          logger,
          fetchApi,
          discovery: discoveryService,
          auth: authService,
        }),
      ).toThrow(/Either schedule or scheduler must be provided./);
    });
  });

  describe('#connect', () => {
    it('Should schedule a call to refresh the data', async () => {
      const {
        sut,
        schedule,
        connection,
        fetchApi,
        authService,
        discoveryService,
      } = setup();
      const abort = new AbortController();
      mockAdpDatabaseEntityProviderConnectionCtor.mockReturnValueOnce(
        mockAdpDatabaseEntityProviderConnectionInstance,
      );

      await sut.connect(connection);
      expect(schedule.run).toHaveBeenCalledTimes(1);
      await schedule.run.mock.calls[0][0].fn(abort.signal);
      expect(mockAdpDatabaseEntityProviderConnectionCtor).toHaveBeenCalledWith(
        AdpDatabaseEntityProvider.name,
        connection,
        discoveryService,
        fetchApi,
        authService,
        expect.any(Object),
      );
      expect(
        mockAdpDatabaseEntityProviderConnectionInstance.refresh,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
