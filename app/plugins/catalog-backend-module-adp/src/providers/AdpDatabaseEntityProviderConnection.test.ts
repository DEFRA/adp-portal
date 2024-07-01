import { AdpDatabaseEntityProvider } from './AdpDatabaseEntityProvider';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import type {
  AuthService,
  BackstageCredentials,
  BackstageServicePrincipal,
  DiscoveryService,
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { AdpDatabaseEntityProviderConnection } from './AdpDatabaseEntityProviderConnection';
import { randomUUID } from 'node:crypto';
import {
  armsLengthBody,
  deliveryProgramme,
  deliveryProject,
  mockAlbTransformerData,
  mockProgrammeTransformerData,
  mockProjectTransformerData,
} from '../testData/entityProviderTestData';
import { mockServices } from '@backstage/backend-test-utils';

describe('AdpDatabaseEntityProviderConnection', () => {
  function setup() {
    const logger = mockServices.logger.mock();
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
    const schedule: jest.Mocked<SchedulerServiceTaskRunner> = {
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
    const self: BackstageCredentials<BackstageServicePrincipal> = {
      $$type: '@backstage/BackstageCredentials',
      principal: {
        subject: randomUUID(),
        type: 'service',
      },
    };
    return {
      logger,
      fetchApi,
      authService,
      discoveryService,
      scheduler,
      schedule,
      connection,
      self,
      get sut() {
        return new AdpDatabaseEntityProviderConnection(
          AdpDatabaseEntityProvider.name,
          connection,
          discoveryService,
          fetchApi,
          authService,
          logger,
        );
      },
    };
  }

  describe('#refresh', () => {
    it('Should perform the update', async () => {
      const { sut, discoveryService, authService, fetchApi, self, connection } =
        setup();
      const token = randomUUID();
      discoveryService.getBaseUrl.mockResolvedValue(
        'https://localhost:7007/api/adp',
      );
      authService.getOwnServiceCredentials.mockResolvedValue(self);
      authService.getPluginRequestToken.mockResolvedValue({ token });
      fetchApi.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify(armsLengthBody), { status: 200 }),
      );
      fetchApi.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify(deliveryProgramme), {
          status: 200,
        }),
      );
      for (const programme of mockProgrammeTransformerData) {
        fetchApi.fetch.mockResolvedValueOnce(
          new Response(
            JSON.stringify(programme.spec.members.map(m => ({ email: m }))),
            {
              status: 200,
            },
          ),
        );
      }
      fetchApi.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify(deliveryProject), {
          status: 200,
        }),
      );
      for (const project of mockProjectTransformerData) {
        fetchApi.fetch.mockResolvedValueOnce(
          new Response(
            JSON.stringify(project.spec.members.map(m => ({ email: m }))),
            {
              status: 200,
            },
          ),
        );
      }

      await sut.refresh();

      expect(fetchApi.fetch).toHaveBeenCalledTimes(
        3 + deliveryProgramme.length + deliveryProject.length,
      );
      for (const args of fetchApi.fetch.mock.calls) {
        const request = new Request(...args);
        expect(request.url).toMatch(/^https:\/\/localhost:7007\/api\/adp/);
        expect(request.method).toBe('GET');
        expect(request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      }
      expect(connection.applyMutation).toHaveBeenCalledTimes(1);
      expect(connection.applyMutation).toHaveBeenCalledWith({
        type: 'full',
        entities: [
          ...mockAlbTransformerData,
          ...mockProgrammeTransformerData,
          ...mockProjectTransformerData,
        ].map(e => ({
          locationKey: AdpDatabaseEntityProvider.name,
          entity: e,
        })),
      });
    });
    it('Should error if an api call fails', async () => {
      const { sut, discoveryService, authService, fetchApi, self, connection } =
        setup();
      const token = randomUUID();
      discoveryService.getBaseUrl.mockResolvedValue(
        'https://localhost:7007/api/adp',
      );
      authService.getOwnServiceCredentials.mockResolvedValue(self);
      authService.getPluginRequestToken.mockResolvedValue({ token });
      fetchApi.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify(armsLengthBody), {
          status: 401,
          statusText: 'NotFound',
        }),
      );

      const test = () => sut.refresh();
      await expect(test).rejects.toThrow(
        /Unexpected response from ADP plugin, GET .*?\. Expected 200 but got 401 - NotFound/,
      );

      expect(fetchApi.fetch).toHaveBeenCalledTimes(1);
      for (const args of fetchApi.fetch.mock.calls) {
        const request = new Request(...args);
        expect(request.url).toMatch(/^https:\/\/localhost:7007\/api\/adp/);
        expect(request.method).toBe('GET');
        expect(request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      }
      expect(connection.applyMutation).not.toHaveBeenCalled();
    });
  });
});
