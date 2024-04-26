import { Config } from '@backstage/config';
import fetch from 'node-fetch';

export type SetTeamRequest = {
  description?: string;
  members?: string[];
  maintainers?: string[];
  isPublic?: boolean;
};

export type GithubTeamDetails = {
  id: number;
  name: string;
  members: string[];
  maintainers: string[];
  description: string;
  isPublic: boolean;
  slug: string;
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

  public async setTeam(teamName: string, request: SetTeamRequest) {
    const baseUrl = this.#config.getString('adp.githubTeams.apiBaseUrl');
    const endpoint = `${baseUrl}/${teamName}`;
    const response = await this.#fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to set the team info - ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as GithubTeamDetails;
  }
}
