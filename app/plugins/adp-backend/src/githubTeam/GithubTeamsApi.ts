import type { Config } from '@backstage/config';
import type { GithubTeamDetails } from '@internal/plugin-adp-common';
import fetch from 'node-fetch';

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
  readonly #fetch: typeof fetch;
  readonly #config: Config;

  constructor(config: Config, fetchApi = fetch) {
    this.#config = config;
    this.#fetch = fetchApi;
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
    const response = await this.#fetch(endpoint, {
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
