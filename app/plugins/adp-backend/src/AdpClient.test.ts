import type {
  BackstageCredentials,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { AdpClient } from './AdpClient';
import { randomUUID } from 'node:crypto';
import type { DeliveryProjectTeamsSyncResult } from '@internal/plugin-adp-common';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';

describe('AdpClient', () => {
  async function setup() {
    const discoveryApi: jest.Mocked<DiscoveryService> = {
      getBaseUrl: jest.fn(),
      getExternalBaseUrl: jest.fn(),
    };
    const fetchApi: jest.Mocked<FetchApi> = {
      fetch: jest.fn(),
    };
    let credentials: BackstageCredentials = mockCredentials.user();
    return {
      discoveryApi,
      fetchApi,
      setCredentials(value: BackstageCredentials) {
        credentials = value;
      },
      get sut() {
        return new AdpClient({
          discoveryApi,
          fetchApi,
          auth: mockServices.auth(),
          credentials: { current: credentials },
        });
      },
    };
  }

  describe('#syncDeliveryProjectWithGithubTeams', () => {
    it('Should return the team when the API call is successful', async () => {
      // arrange
      const { sut, discoveryApi, fetchApi } = await setup();
      const teamName = randomUUID();
      const expected: DeliveryProjectTeamsSyncResult = {
        admins: {
          description: 'Admins team',
          id: 123,
          isPublic: true,
          maintainers: ['abc'],
          members: ['def'],
          name: 'Admins-Team',
          slug: 'admins-team',
        },
        contributors: {
          description: 'Contributors team',
          id: 456,
          isPublic: true,
          maintainers: ['ghi'],
          members: ['jkl'],
          name: 'Contributors-Team',
          slug: 'Contributors-team',
        },
      };
      const response = new Response(JSON.stringify(expected), {
        status: 200,
      });

      discoveryApi.getBaseUrl.mockResolvedValueOnce('http://localhost/adp');
      fetchApi.fetch.mockResolvedValueOnce(response);

      // act
      const actual = await sut.syncDeliveryProjectWithGithubTeams(teamName);

      // assert
      expect(actual).toMatchObject(expected);
      expect(discoveryApi.getBaseUrl.mock.calls).toMatchObject([['adp']]);
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `http://localhost/adp/deliveryProjects/${teamName}/github/teams/sync`,
          {
            method: 'PUT',
            headers: {
              Authorization:
                'Bearer mock-service-token:{"obo":"user:default/mock","target":"adp"}',
            },
          },
        ],
      ]);
    });
    it('Should throw when the API call fails', async () => {
      // arrange
      const { sut, discoveryApi, fetchApi } = await setup();
      const teamName = randomUUID();
      const response = new Response(undefined, {
        status: 400,
      });

      discoveryApi.getBaseUrl.mockResolvedValueOnce('http://localhost/adp');
      fetchApi.fetch.mockResolvedValueOnce(response);

      // act
      await expectException(() =>
        sut.syncDeliveryProjectWithGithubTeams(teamName),
      );

      // assert
      expect(discoveryApi.getBaseUrl.mock.calls).toMatchObject([['adp']]);
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `http://localhost/adp/deliveryProjects/${teamName}/github/teams/sync`,
          {
            method: 'PUT',
            headers: {
              Authorization:
                'Bearer mock-service-token:{"obo":"user:default/mock","target":"adp"}',
            },
          },
        ],
      ]);
    });
  });
});

async function expectException(action: () => unknown) {
  try {
    await action();
    throw new Error('No exception was thrown where one was expected');
  } catch (err) {
    return err;
  }
}
