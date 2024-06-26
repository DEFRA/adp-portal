import type { Config } from '@backstage/config';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';

export type IAdoProjectApi = { [P in keyof AdoProjectApi]: AdoProjectApi[P] };
export class AdoProjectApi {
  readonly #apiBaseUrl: string;
  readonly #fetchApi: FetchApi;

  constructor(config: Config, fetchApi: FetchApi) {
    this.#apiBaseUrl = config.getString('adp.adoProject.apiBaseUrl');
    this.#fetchApi = fetchApi;
  }

  async checkIfAdoProjectExists(projectName: string): Promise<boolean> {
    const endpoint = `${this.#apiBaseUrl}/${projectName}`;

    const response = await this.#fetchApi.fetch(endpoint);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ADO Project details for project ${projectName} - ${response.status} ${response.statusText}`,
      );
    }
    return response.ok;
  }
}
