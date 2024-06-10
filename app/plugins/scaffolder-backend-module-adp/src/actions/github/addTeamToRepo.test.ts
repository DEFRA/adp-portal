import { ConfigReader } from '@backstage/config';
import {
  ScmIntegrations,
  DefaultGithubCredentialsProvider,
} from '@backstage/integration';
import {
  type AddGithubTeamToRepoActionInput,
  addGithubTeamToRepoAction,
} from './addTeamToRepo';
import { Octokit } from 'octokit';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

jest.mock('octokit');
const mockedOctokit = Octokit as unknown as jest.Mock;
mockedOctokit.mockImplementation(() => ({
  rest: {
    teams: {
      getByName: jest.fn(),
      addOrUpdateRepoPermissionsInOrg: jest.fn(),
    },
  },
}));

jest.mock('@backstage/integration', () => ({
  DefaultGithubCredentialsProvider: {
    fromIntegrations: jest.fn().mockReturnValue({
      getCredentials: jest.fn().mockReturnValue(
        Promise.resolve({
          token: 'fake_token',
        }),
      ),
    }),
  },
  ScmIntegrations: {
    fromConfig: jest.fn().mockReturnValue({}),
  },
}));

describe('adp:github:team:add', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  const config = new ConfigReader({
    github: {
      host: 'github.com',
      organization: 'org',
    },
    integrations: {
      github: [
        {
          host: 'github.com',
          apps: [
            {
              appId: 'fake_id',
              webhookUrl: 'https://smee.io/',
              clientId: 'fake_client_id',
              clientSecret: 'fake_client_secret',
              webhookSecret: 'ThisIsRequiredButNotUsed',
              privateKey: 'pkey',
            },
          ],
        },
      ],
    },
  });

  const integrations = ScmIntegrations.fromConfig(config);
  const action = addGithubTeamToRepoAction({
    integrations: integrations,
    config: config,
  });

  it('should throw if there is no integration config provided', async () => {
    const context = createMockActionContext<AddGithubTeamToRepoActionInput>({
      input: {
        teamNames: 'test-team,test-team1',
        repoName: 'test-team',
        orgName: 'defra-adp-sandpit',
        owner: 'defra-adp-sandpit',
        permission: 'push',
      },
      workspacePath: 'test-workspace',
    });
    DefaultGithubCredentialsProvider.fromIntegrations = jest
      .fn()
      .mockReturnValue({
        getCredentials: jest.fn().mockResolvedValue(undefined),
      });
    await expect(action.handler(context)).rejects.toThrow(
      /No credentials provided/,
    );
  });

  it('should log error if team doesnt exists in org', async () => {
    const context = createMockActionContext<AddGithubTeamToRepoActionInput>({
      input: {
        teamNames: 'test-team,test-team1',
        repoName: 'test-team',
        orgName: 'defra-adp-sandpit',
        owner: 'defra-adp-sandpit',
        permission: 'push',
      },
      workspacePath: 'test-workspace',
    });
    context.logger.info = jest.fn();
    DefaultGithubCredentialsProvider.fromIntegrations = jest
      .fn()
      .mockReturnValue({
        getCredentials: jest.fn().mockResolvedValue({
          token: 'fake_token',
        }),
      });
    mockedOctokit.mockImplementation(() => ({
      rest: {
        teams: {
          getByName: jest.fn().mockRejectedValue({
            status: 404,
          }),
          addOrUpdateRepoPermissionsInOrg: jest.fn(),
        },
      },
    }));

    await action.handler(context);

    expect(context.logger.info).toHaveBeenCalledWith(
      "GitHub team test-team doesn't exist in the org",
    );
  });

  it('should log error if unknown error in checkTeamExists', async () => {
    const context = createMockActionContext<AddGithubTeamToRepoActionInput>({
      input: {
        teamNames: 'test-team,test-team1',
        repoName: 'test-team',
        orgName: 'defra-adp-sandpit',
        owner: 'defra-adp-sandpit',
        permission: 'push',
      },
      workspacePath: 'test-workspace',
    });
    context.logger.error = jest.fn();
    DefaultGithubCredentialsProvider.fromIntegrations = jest
      .fn()
      .mockReturnValue({
        getCredentials: jest.fn().mockResolvedValue({
          token: 'fake_token',
        }),
      });
    mockedOctokit.mockImplementation(() => ({
      rest: {
        teams: {
          getByName: jest.fn().mockRejectedValue({
            status: 403,
          }),
          addOrUpdateRepoPermissionsInOrg: jest.fn(),
        },
      },
    }));

    await action.handler(context);

    expect(context.logger.error).toHaveBeenCalledWith(
      'Error in getting GitHub team: [object Object]',
    );
  });

  it('should throw if adding team to repo failed', async () => {
    const context = createMockActionContext<AddGithubTeamToRepoActionInput>({
      input: {
        teamNames: 'test-team,test-team1',
        repoName: 'test-team',
        orgName: 'defra-adp-sandpit',
        owner: 'defra-adp-sandpit',
        permission: 'push',
      },
      workspacePath: 'test-workspace',
    });
    DefaultGithubCredentialsProvider.fromIntegrations = jest
      .fn()
      .mockReturnValue({
        getCredentials: jest.fn().mockResolvedValue({
          token: 'fake_token',
        }),
      });
    mockedOctokit.mockImplementation(() => ({
      rest: {
        teams: {
          getByName: jest.fn().mockResolvedValue({
            status: 200,
          }),
          addOrUpdateRepoPermissionsInOrg: jest
            .fn()
            .mockRejectedValue(new Error('error occured')),
        },
      },
    }));

    await expect(action.handler(context)).rejects.toThrow(
      /Adding team to the repo failed with error/,
    );
  });

  it('should add team to repo on success', async () => {
    const context = createMockActionContext<AddGithubTeamToRepoActionInput>({
      input: {
        teamNames: 'test-team,test-team1',
        repoName: 'test-team',
        orgName: 'defra-adp-sandpit',
        owner: 'defra-adp-sandpit',
        permission: 'push',
      },
      workspacePath: 'test-workspace',
    });
    context.logger.info = jest.fn();
    DefaultGithubCredentialsProvider.fromIntegrations = jest
      .fn()
      .mockReturnValue({
        getCredentials: jest.fn().mockResolvedValue({
          token: 'fake_token',
        }),
      });
    mockedOctokit.mockImplementation(() => ({
      rest: {
        teams: {
          getByName: jest.fn().mockResolvedValue({
            status: 200,
          }),
          addOrUpdateRepoPermissionsInOrg: jest.fn().mockResolvedValue({
            status: 204,
          }),
        },
      },
    }));

    await action.handler(context);

    expect(context.logger.info).toHaveBeenCalledWith(
      'Team test-team exists in github org defra-adp-sandpit',
    );
    expect(context.logger.info).toHaveBeenCalledWith(
      'Added team test-team to the repo test-team successfully',
    );
  });
});
