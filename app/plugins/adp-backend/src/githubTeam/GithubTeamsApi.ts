import type { Config } from '@backstage/config';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import type { GithubTeamDetails } from '@internal/plugin-adp-common';

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

  constructor(config: Config, fetchApi: FetchApi) {
    this.#config = config;
    this.#fetchApi = fetchApi;
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
    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.status === 200) return await response.json();

    throw new Error(
      `Failed to set the team info - ${response.status} ${response.statusText}`,
    );
  }
}
