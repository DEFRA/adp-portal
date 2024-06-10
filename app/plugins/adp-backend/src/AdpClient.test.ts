import type {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { AdpClient } from './AdpClient';
import { randomUUID } from 'node:crypto';
import type { DeliveryProjectTeamsSyncResult } from '@internal/plugin-adp-common';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';

describe('AdpClient', () => {
  function setup() {
    const discoveryApi: jest.Mocked<DiscoveryService> = {
      getBaseUrl: jest.fn(),
      getExternalBaseUrl: jest.fn(),
    };
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
    const credentials: BackstageCredentials = {
      $$type: '@backstage/BackstageCredentials',
      principal: randomUUID(),
    };
    return {
      discoveryApi,
      fetchApi,
      authService,
      credentials,
      get sut() {
        return new AdpClient({
          discoveryApi,
          fetchApi,
          auth: authService,
          credentials,
        });
      },
    };
  }

  describe('#syncDeliveryProjectWithGithubTeams', () => {
    it('Should return the team when the API call is successful', async () => {
      // arrange
      const { sut, discoveryApi, fetchApi, authService } = setup();
      const token = randomUUID();
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

      authService.getPluginRequestToken.mockResolvedValueOnce({ token });
      discoveryApi.getBaseUrl.mockResolvedValueOnce('http://localhost/adp');
      fetchApi.fetch.mockResolvedValueOnce(response);

      // act
      const actual = await sut.syncDeliveryProjectWithGithubTeams(teamName);

      // assert
      expect(actual).toMatchObject(expected);
      expect(discoveryApi.getBaseUrl.mock.calls).toMatchObject([['adp']]);
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `http://localhost/adp/deliveryProject/${teamName}/github/teams/sync`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ],
      ]);
    });
    it('Should throw when the API call fails', async () => {
      // arrange
      const { sut, discoveryApi, fetchApi, authService } = setup();
      const token = randomUUID();
      const teamName = randomUUID();
      const response = new Response(undefined, {
        status: 400,
      });

      authService.getPluginRequestToken.mockResolvedValueOnce({ token });
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
          `http://localhost/adp/deliveryProject/${teamName}/github/teams/sync`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
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
