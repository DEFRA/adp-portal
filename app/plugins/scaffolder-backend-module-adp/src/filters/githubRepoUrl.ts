import type { Config } from '@backstage/config';
import type { JsonValue } from '@backstage/types';

export function createGithubRepoUrlFilter(config: Config) {
  const orgName = config.getString('github.organization');
  const repoUrl = new URL(`https://github.com/`);
  repoUrl.searchParams.set('owner', orgName);

  return function githubRepoUrl(input: JsonValue) {
    const result = new URL(repoUrl);
    result.searchParams.set('repo', String(input));
    return result.toString();
  };
}
