import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import {
  DefaultGithubCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { Octokit } from 'octokit';

export async function createGithubClient(
  integrations: ScmIntegrationRegistry,
  config: Config,
  organization: string,
): Promise<Octokit> {
  const credentialsProvider =
    DefaultGithubCredentialsProvider.fromIntegrations(integrations);
  const url = `https://${config.getString('github.host')}/${organization}`;
  const credentials = await credentialsProvider.getCredentials({
    url: url,
  });

  if (credentials === undefined) {
    throw new InputError(
      `No credentials provided for ${url}. Check your integrations config.`,
    );
  }

  return new Octokit({
    auth: credentials.token,
  });
}
