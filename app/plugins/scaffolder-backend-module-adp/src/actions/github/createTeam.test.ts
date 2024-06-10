import { ConfigReader } from '@backstage/config';
import {
  ScmIntegrations,
  DefaultGithubCredentialsProvider,
} from '@backstage/integration';
import {
  type CreateGithubTeamActionInput,
  createGithubTeamAction,
} from './createTeam';
import { Octokit } from 'octokit';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

jest.mock('octokit');
const mockedOctokit = Octokit as unknown as jest.Mock;
mockedOctokit.mockImplementation(() => ({
  rest: {
    teams: {
      getByName: jest.fn(),
      create: jest.fn(),
      addOrUpdateMembershipForUserInOrg: jest.fn(),
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

describe('adp:github:team:create', () => {
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
  const action = createGithubTeamAction({
    integrations: integrations,
    config: config,
  });

  it('should throw if there is no integration config provided', async () => {
    const context = createMockActionContext<CreateGithubTeamActionInput>({
      input: {
        githubTeamName: 'test-team',
        githubTeamDescription: 'test team',
        orgName: 'defra-adp-sandpit',
        users: 'test1, test2',
        visibility: 'closed',
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

  it('should throw if creating team failed', async () => {
    const context = createMockActionContext<CreateGithubTeamActionInput>({
      input: {
        githubTeamName: 'test-team',
        githubTeamDescription: 'test team',
        orgName: 'defra-adp-sandpit',
        users: 'test1, test2',
        visibility: 'closed',
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
          getByName: jest.fn().mockRejectedValue({
            status: 404,
          }),
          create: jest.fn().mockRejectedValue(new Error('error occured')),
          addOrUpdateMembershipForUserInOrg: jest
            .fn()
            .mockResolvedValue({ status: 200 }),
        },
      },
    }));

    await expect(action.handler(context)).rejects.toThrow(
      /Creating team failed/,
    );
  });

  it('should throw if creating team succeded and adding user failed', async () => {
    const context = createMockActionContext<CreateGithubTeamActionInput>({
      input: {
        githubTeamName: 'test-team',
        githubTeamDescription: 'test team',
        orgName: 'defra-adp-sandpit',
        users: 'test1, test2',
        visibility: 'closed',
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
            status: 404,
          }),
          create: jest.fn().mockResolvedValue({ status: 201 }),
          addOrUpdateMembershipForUserInOrg: jest
            .fn()
            .mockRejectedValue(new Error('error occured')),
        },
      },
    }));

    await expect(action.handler(context)).rejects.toThrow(
      /Adding user to the team failed/,
    );
  });

  it('should add user and team already exists', async () => {
    const context = createMockActionContext<CreateGithubTeamActionInput>({
      input: {
        githubTeamName: 'test-team',
        githubTeamDescription: 'test team',
        users: 'test1, test2',
        visibility: 'closed',
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
          create: jest.fn().mockResolvedValue({ status: 201 }),
          addOrUpdateMembershipForUserInOrg: jest
            .fn()
            .mockResolvedValue({ status: 200 }),
        },
      },
    }));

    await action.handler(context);

    expect(context.logger.info).toHaveBeenCalledWith(
      'Added user test1 to the team successfully',
    );
    expect(context.logger.info).toHaveBeenCalledWith(
      'Added user test2 to the team successfully',
    );
  });
});
