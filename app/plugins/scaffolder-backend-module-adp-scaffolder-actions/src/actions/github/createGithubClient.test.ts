import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { Octokit } from 'octokit';
import { createGithubClient } from './createGithubClient';
import { randomUUID } from 'node:crypto';

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

describe('createGithubClient', () => {
  it('Creates a github client', async () => {
    // arrange
    const organization = randomUUID();
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

    // act
    const actual = await createGithubClient(integrations, config, organization);
    const auth = await actual.auth();

    // assert
    expect(actual).toBeInstanceOf(Octokit);
    expect(auth).toMatchObject({
      type: 'token',
      token: 'fake_token',
      tokenType: 'oauth',
    });
  });
});
