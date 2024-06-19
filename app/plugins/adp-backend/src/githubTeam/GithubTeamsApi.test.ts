import type { Config } from '@backstage/config';
import { GitHubTeamsApi } from './GithubTeamsApi';
import type { GithubTeamDetails } from '@internal/plugin-adp-common';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';

describe('GitHubTeamsApi', () => {
  function setup() {
    const config: jest.MockedObject<Config> = {
      getString: jest.fn(),
      get: jest.fn(),
      getBoolean: jest.fn(),
      getConfig: jest.fn(),
      getConfigArray: jest.fn(),
      getNumber: jest.fn(),
      getOptional: jest.fn(),
      getOptionalBoolean: jest.fn(),
      getOptionalConfig: jest.fn(),
      getOptionalConfigArray: jest.fn(),
      getOptionalNumber: jest.fn(),
      getOptionalString: jest.fn(),
      getOptionalStringArray: jest.fn(),
      getStringArray: jest.fn(),
      has: jest.fn(),
      keys: jest.fn(),
      subscribe: undefined,
    };
    const fetchApi: jest.Mocked<FetchApi> = {
      fetch: jest.fn(),
    };
    const sut = new GitHubTeamsApi({
      config,
      fetchApi,
      auth: mockServices.auth(),
      credentials: { current: mockCredentials.user() },
    });

    return { sut, fetchApi, config };
  }

  describe('#createTeam', () => {
    it('Should return the response when the API call is successful', async () => {
      // arrange
      const { sut, config, fetchApi } = setup();
      const expected: GithubTeamDetails = {
        description: 'description',
        id: 123,
        isPublic: true,
        maintainers: ['abc'],
        members: ['def'],
        name: 'name',
        slug: 'slug',
      };
      const response = new Response(JSON.stringify(expected), { status: 200 });

      config.getString.mockImplementationOnce(x => {
        expect(x).toBe('adp.githubTeams.apiBaseUrl');
        return 'https://localhost/api';
      });
      fetchApi.fetch.mockResolvedValueOnce(response);

      // act
      const actual = await sut.createTeam({
        name: 'name',
        description: 'description',
        isPublic: true,
        maintainers: ['abc'],
        members: ['def'],
      });

      // assert
      expect(actual).toMatchObject(expected);
      expect(config.getString.mock.calls).toMatchObject([
        ['adp.githubTeams.apiBaseUrl'],
      ]);
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `https://localhost/api`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"name":"name","description":"description","isPublic":true,"maintainers":["abc"],"members":["def"]}',
          },
        ],
      ]);
    });
    it('Should throw an error when the API call is not successful', async () => {
      // arrange
      const { sut, config, fetchApi } = setup();
      const response = new Response(undefined, { status: 400 });

      config.getString.mockImplementationOnce(x => {
        expect(x).toBe('adp.githubTeams.apiBaseUrl');
        return 'https://localhost/api';
      });
      fetchApi.fetch.mockResolvedValueOnce(response);

      // act
      await expectException(() =>
        sut.createTeam({
          name: 'name',
          description: 'description',
          isPublic: true,
          maintainers: ['abc'],
          members: ['def'],
        }),
      );

      // assert
      expect(config.getString.mock.calls).toMatchObject([
        ['adp.githubTeams.apiBaseUrl'],
      ]);
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `https://localhost/api`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"name":"name","description":"description","isPublic":true,"maintainers":["abc"],"members":["def"]}',
          },
        ],
      ]);
    });
  });
  describe('#setTeam', () => {
    it('Should return the response when the API call is successful', async () => {
      // arrange
      const { sut, config, fetchApi } = setup();
      const teamId = Math.random();
      const expected: GithubTeamDetails = {
        description: 'description',
        id: 123,
        isPublic: true,
        maintainers: ['abc'],
        members: ['def'],
        name: 'name',
        slug: 'slug',
      };
      const response = new Response(JSON.stringify(expected), { status: 200 });

      config.getString.mockImplementationOnce(x => {
        expect(x).toBe('adp.githubTeams.apiBaseUrl');
        return 'http://localhost/api';
      });
      fetchApi.fetch.mockResolvedValueOnce(response);

      // act
      const actual = await sut.setTeam(teamId, {
        name: 'name',
        description: 'description',
        isPublic: true,
        maintainers: ['abc'],
        members: ['def'],
      });

      // assert
      expect(actual).toMatchObject(expected);
      expect(config.getString.mock.calls).toMatchObject([
        ['adp.githubTeams.apiBaseUrl'],
      ]);
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `http://localhost/api/${teamId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"name":"name","description":"description","isPublic":true,"maintainers":["abc"],"members":["def"]}',
          },
        ],
      ]);
    });
    it('Should throw an error when the API call is not successful', async () => {
      // arrange
      const { sut, config, fetchApi } = setup();
      const teamId = Math.random();
      const response = new Response(undefined, { status: 400 });

      config.getString.mockImplementationOnce(x => {
        expect(x).toBe('adp.githubTeams.apiBaseUrl');
        return 'http://localhost/api';
      });
      fetchApi.fetch.mockResolvedValueOnce(response);

      // act
      await expectException(() =>
        sut.setTeam(teamId, {
          name: 'name',
          description: 'description',
          isPublic: true,
          maintainers: ['abc'],
          members: ['def'],
        }),
      );

      // assert
      expect(config.getString.mock.calls).toMatchObject([
        ['adp.githubTeams.apiBaseUrl'],
      ]);
      expect(fetchApi.fetch.mock.calls).toMatchObject([
        [
          `http://localhost/api/${teamId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"name":"name","description":"description","isPublic":true,"maintainers":["abc"],"members":["def"]}',
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
