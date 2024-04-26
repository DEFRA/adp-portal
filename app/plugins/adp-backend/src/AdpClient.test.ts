import { DiscoveryService } from '@backstage/backend-plugin-api';
import { AdpClient } from './AdpClient';
import fetch, { Response } from 'node-fetch';
import { randomUUID } from 'node:crypto';
import { DeliveryProjectTeamsSyncResult } from './deliveryProject';

describe('AdpClient', () => {
  function setup() {
    const discoveryApi: jest.Mocked<DiscoveryService> = {
      getBaseUrl: jest.fn(),
      getExternalBaseUrl: jest.fn(),
    };
    const fetchApi: jest.MockedFn<typeof fetch> = Object.assign(jest.fn(), {
      isRedirect: jest.fn(),
    });
    const sut = new AdpClient({
      discoveryApi,
      fetchApi,
    });
    return { sut, discoveryApi, fetchApi };
  }

  describe('#syncDeliveryProjectWithGithubTeams', () => {
    it('Should return the team when the API call is successful', async () => {
      // arrange
      const { sut, discoveryApi, fetchApi } = setup();
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
      fetchApi.mockResolvedValueOnce(response);

      // act
      const actual = await sut.syncDeliveryProjectWithGithubTeams(teamName);

      // assert
      expect(actual).toMatchObject(expected);
      expect(discoveryApi.getBaseUrl.mock.calls).toMatchObject([['adp']]);
      expect(fetchApi.mock.calls).toMatchObject([
        [
          `http://localhost/adp/deliveryProject/${teamName}/github/teams/sync`,
          {
            method: 'PUT',
          },
        ],
      ]);
    });
    it('Should throw when the API call fails', async () => {
      // arrange
      const { sut, discoveryApi, fetchApi } = setup();
      const teamName = randomUUID();
      const response = new Response(undefined, {
        status: 400,
      });

      discoveryApi.getBaseUrl.mockResolvedValueOnce('http://localhost/adp');
      fetchApi.mockResolvedValueOnce(response);

      // act
      await expectException(() =>
        sut.syncDeliveryProjectWithGithubTeams(teamName),
      );

      // assert
      expect(discoveryApi.getBaseUrl.mock.calls).toMatchObject([['adp']]);
      expect(fetchApi.mock.calls).toMatchObject([
        [
          `http://localhost/adp/deliveryProject/${teamName}/github/teams/sync`,
          {
            method: 'PUT',
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
