import { ConfigReader } from '@backstage/config';
import {
  ScmIntegrations,
  DefaultGithubCredentialsProvider,
} from '@backstage/integration';
import { createGithubTeamAction } from './createTeam';
import { getVoidLogger } from '@backstage/backend-common';
import { PassThrough } from 'stream';
import { Octokit } from 'octokit';

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

jest.mock('@backstage/backend-common', () => ({
  getVoidLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
  }),
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

  const mockContext = {
    input: {
      githubTeamName: 'test-team',
      githubTeamDescription: 'test team',
      orgName: 'defra-adp-sandpit',
      users: 'test1, test2',
      visibility: 'closed',
    },
    workspacePath: 'test-workspace',
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };

  it('should throw if there is no integration config provided', async () => {
    DefaultGithubCredentialsProvider.fromIntegrations = jest
      .fn()
      .mockReturnValue({
        getCredentials: jest.fn().mockResolvedValue(undefined),
      });
    await expect(
      action.handler({
        ...mockContext,
        input: {
          githubTeamName: 'test-team',
          githubTeamDescription: 'test team',
          orgName: 'defra-adp-sandpit',
          users: 'test1, test2',
          visibility: 'closed',
        },
      }),
    ).rejects.toThrow(/No credentials provided/);
  });

  it('should throw if creating team failed', async () => {
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

    await expect(
      action.handler({
        ...mockContext,
        input: {
          githubTeamName: 'test-team',
          githubTeamDescription: 'test team',
          orgName: 'defra-adp-sandpit',
          users: 'test1, test2',
          visibility: 'closed',
        },
      }),
    ).rejects.toThrow(/Creating team failed/);
  });

  it('should throw if creating team succeded and adding user failed', async () => {
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

    await expect(
      action.handler({
        ...mockContext,
        input: {
          githubTeamName: 'test-team',
          githubTeamDescription: 'test team',
          orgName: 'defra-adp-sandpit',
          users: 'test1, test2',
          visibility: 'closed',
        },
      }),
    ).rejects.toThrow(/Adding user to the team failed/);
  });

  it('should add user and team already exists', async () => {
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

    await action.handler({
      ...mockContext,
      input: {
        githubTeamName: 'test-team',
        githubTeamDescription: 'test team',
        users: 'test1, test2',
        visibility: 'closed',
      },
    });

    expect(mockContext.logger.info).toHaveBeenCalledWith(
      'Added user test1 to the team successfully',
    );
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      'Added user test2 to the team successfully',
    );
  });
});
