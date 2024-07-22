import type { Config } from '@backstage/config';
import type { JsonValue } from '@backstage/types';

export function createGithubRepoUrlFilter(config: Config) {
  const owner = config.getString('github.organization');
  return function githubRepoUrl(input: JsonValue) {
    const props = new URLSearchParams({ owner, repo: String(input) });
    return `github.com?${props}`;
  };
}
