import type { Config } from '@backstage/config';
import {
  type AddDeliveryProjectToRepoInput,
  addDeliveryProjectToRepo,
} from './addDeliveryProjectToRepo';
import type { Octokit } from 'octokit';
import { randomUUID } from 'node:crypto';
import { mockedOctokit } from './mockedOctokit';
import type {
  DeliveryProjectTeamsSyncResult,
  IAdpClient,
} from '@internal/plugin-adp-common';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

describe('addDeliveryProjectToRepo', () => {
  function setup() {
    const config: jest.Mocked<Config> = {
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
    };
    const getGithubClient = jest.fn<Promise<Octokit>, [organization: string]>();
    const adpClient: jest.Mocked<IAdpClient> = {
      syncDeliveryProjectWithGithubTeams: jest.fn(),
    };
    const octokit = mockedOctokit();

    getGithubClient.mockImplementation(() => Promise.resolve(octokit));

    const sut = addDeliveryProjectToRepo({
      config,
      getGithubClient,
      adpClient: () => adpClient,
    });
    return { sut, config, getGithubClient, adpClient, octokit };
  }

  describe('#handler', () => {
    it('Should sync the team then assign the team', async () => {
      // arrange
      const { sut, adpClient, config, octokit } = setup();
      const projectName = randomUUID();
      const repoName = randomUUID();
      const orgName = randomUUID();
      const owner = randomUUID();
      const context = createMockActionContext<AddDeliveryProjectToRepoInput>({
        input: {
          projectName,
          repoName,
          orgName,
          owner,
        },
        workspacePath: 'test-workspace',
      });

      const teams: DeliveryProjectTeamsSyncResult = {
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
          slug: 'contributors-team',
        },
      };

      adpClient.syncDeliveryProjectWithGithubTeams.mockResolvedValueOnce(teams);
      config.getString.mockImplementationOnce(x => {
        expect(x).toBe('github.platformAdmins');
        return 'Platform-Admins';
      });
      octokit.rest.teams.addOrUpdateRepoPermissionsInOrg.mockResolvedValue(
        undefined!,
      );

      // act
      await sut.handler(context);

      // assert
      expect(
        adpClient.syncDeliveryProjectWithGithubTeams.mock.calls,
      ).toMatchObject([[projectName]]);
      expect(config.getString.mock.calls).toMatchObject([
        ['github.platformAdmins'],
      ]);
      expect(
        octokit.rest.teams.addOrUpdateRepoPermissionsInOrg.mock.calls,
      ).toMatchObject([
        [
          {
            org: orgName,
            owner,
            repo: repoName,
            team_slug: 'contributors-team',
            permission: 'push',
          },
        ],
        [
          {
            org: orgName,
            owner,
            repo: repoName,
            team_slug: 'admins-team',
            permission: 'admin',
          },
        ],
        [
          {
            org: orgName,
            owner,
            repo: repoName,
            team_slug: 'Platform-Admins',
            permission: 'admin',
          },
        ],
      ]);
    });
    it('Should error when a team fails to be syncronized', async () => {
      // arrange
      const { sut, adpClient, config, octokit } = setup();
      const projectName = randomUUID();
      const repoName = randomUUID();
      const orgName = randomUUID();
      const owner = randomUUID();
      const context = createMockActionContext<AddDeliveryProjectToRepoInput>({
        input: {
          projectName,
          repoName,
          orgName,
          owner,
        },
        workspacePath: 'test-workspace',
      });

      adpClient.syncDeliveryProjectWithGithubTeams.mockRejectedValueOnce(
        new Error('Failed successfully'),
      );

      // act
      await expectException(() => sut.handler(context));

      // assert
      expect(
        adpClient.syncDeliveryProjectWithGithubTeams.mock.calls,
      ).toMatchObject([[projectName]]);
      expect(config.getString.mock.calls).toMatchObject([]);
      expect(
        octokit.rest.teams.addOrUpdateRepoPermissionsInOrg.mock.calls,
      ).toMatchObject([]);
    });
    it('Should error when a team fails to be added', async () => {
      // arrange
      const { sut, adpClient, config, octokit } = setup();
      const projectName = randomUUID();
      const repoName = randomUUID();
      const orgName = randomUUID();
      const owner = randomUUID();
      const context = createMockActionContext<AddDeliveryProjectToRepoInput>({
        input: {
          projectName,
          repoName,
          orgName,
          owner,
        },
        workspacePath: 'test-workspace',
      });

      const teams: DeliveryProjectTeamsSyncResult = {
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
          slug: 'contributors-team',
        },
      };

      adpClient.syncDeliveryProjectWithGithubTeams.mockResolvedValueOnce(teams);
      config.getString.mockImplementationOnce(x => {
        expect(x).toBe('github.platformAdmins');
        return 'Platform-Admins';
      });
      octokit.rest.teams.addOrUpdateRepoPermissionsInOrg
        .mockResolvedValueOnce(undefined!)
        .mockResolvedValueOnce(undefined!)
        .mockRejectedValueOnce(new Error('Failed successfully'));

      // act
      await expectException(() => sut.handler(context));

      // assert
      expect(
        adpClient.syncDeliveryProjectWithGithubTeams.mock.calls,
      ).toMatchObject([[projectName]]);
      expect(config.getString.mock.calls).toMatchObject([
        ['github.platformAdmins'],
      ]);
      expect(
        octokit.rest.teams.addOrUpdateRepoPermissionsInOrg.mock.calls,
      ).toMatchObject([
        [
          {
            org: orgName,
            owner,
            repo: repoName,
            team_slug: 'contributors-team',
            permission: 'push',
          },
        ],
        [
          {
            org: orgName,
            owner,
            repo: repoName,
            team_slug: 'admins-team',
            permission: 'admin',
          },
        ],
        [
          {
            org: orgName,
            owner,
            repo: repoName,
            team_slug: 'Platform-Admins',
            permission: 'admin',
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
