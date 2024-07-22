import type { Config } from '@backstage/config';
import { fetchApiRef, type FetchApi } from '@internal/plugin-fetch-api-backend';
import type { GithubTeamDetails } from '@internal/plugin-adp-common';
import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import {
  tokenProviderRef,
  type TokenProvider,
} from '@internal/plugin-credentials-context-backend';

export type SetTeamRequest = {
  name?: string;
  description?: string;
  members?: string[];
  maintainers?: string[];
  isPublic?: boolean;
};

export type IGitHubTeamsApi = {
  [P in keyof GitHubTeamsApi]: GitHubTeamsApi[P];
};
export class GitHubTeamsApi {
  readonly #fetchApi: FetchApi;
  readonly #config: Config;
  readonly #tokens: TokenProvider;

  constructor({
    config,
    fetchApi,
    tokens,
  }: {
    config: Config;
    fetchApi: FetchApi;
    tokens: TokenProvider;
  }) {
    this.#config = config;
    this.#fetchApi = fetchApi;
    this.#tokens = tokens;
  }

  public async createTeam(request: SetTeamRequest): Promise<GithubTeamDetails> {
    return await this.#setTeam(null, request);
  }

  public async setTeam(
    teamId: number,
    request: SetTeamRequest,
  ): Promise<GithubTeamDetails> {
    return await this.#setTeam(teamId, request);
  }

  async #setTeam(
    teamId: number | null,
    request: SetTeamRequest,
  ): Promise<GithubTeamDetails> {
    const baseUrl = this.#config.getString('adp.githubTeams.apiBaseUrl');
    const endpoint = teamId === null ? baseUrl : `${baseUrl}/${teamId}`;
    const { token } = await this.#tokens.getLimitedUserToken();
    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (response.status === 200) return await response.json();

    throw new Error(
      `Failed to set the team info - ${response.status} ${response.statusText}`,
    );
  }
}

export const githubTeamsApiRef = createServiceRef<IGitHubTeamsApi>({
  id: 'adp.github-teams-api',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          config: coreServices.rootConfig,
          fetchApi: fetchApiRef,
          tokens: tokenProviderRef,
        },
        factory(deps) {
          return new GitHubTeamsApi(deps);
        },
      }),
    );
  },
});
