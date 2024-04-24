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

export class GitHubTeamsApi {
  readonly #apiBaseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(config: Config, fetchApi = fetch) {
    this.#apiBaseUrl = config.getString('adp.githubTeams.apiBaseUrl');
    this.#fetch = fetchApi ?? fetch;
  }

  public async setTeam(teamName: string, request: SetTeamRequest) {
    const endpoint = `${this.#apiBaseUrl}/${teamName}`;
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
