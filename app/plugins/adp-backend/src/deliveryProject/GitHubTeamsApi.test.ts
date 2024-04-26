import { Config } from '@backstage/config';
import { GitHubTeamsApi, GithubTeamDetails } from './GitHubTeamsApi';
import fetch, { Response } from 'node-fetch';
import { randomUUID } from 'node:crypto';

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
    const fetchApi: jest.MockedFn<typeof fetch> = Object.assign(jest.fn(), {
      isRedirect: jest.fn(),
    });
    const sut = new GitHubTeamsApi(config, fetchApi);

    return { sut, fetchApi, config };
  }

  describe('#setTeam', () => {
    it('Should return the response when the API call is successful', async () => {
      // arrange
      const { sut, config, fetchApi } = setup();
      const teamName = randomUUID();
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
      fetchApi.mockResolvedValueOnce(response);

      // act
      const actual = await sut.setTeam(teamName, {
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
      expect(fetchApi.mock.calls).toMatchObject([
        [
          `http://localhost/api/${teamName}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"description":"description","isPublic":true,"maintainers":["abc"],"members":["def"]}',
          },
        ],
      ]);
    });
    it('Should throw an error when the API call is not successful', async () => {
      // arrange
      const { sut, config, fetchApi } = setup();
      const teamName = randomUUID();
      const response = new Response(undefined, { status: 400 });

      config.getString.mockImplementationOnce(x => {
        expect(x).toBe('adp.githubTeams.apiBaseUrl');
        return 'http://localhost/api';
      });
      fetchApi.mockResolvedValueOnce(response);

      // act
      await expectException(() =>
        sut.setTeam(teamName, {
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
      expect(fetchApi.mock.calls).toMatchObject([
        [
          `http://localhost/api/${teamName}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: '{"description":"description","isPublic":true,"maintainers":["abc"],"members":["def"]}',
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
