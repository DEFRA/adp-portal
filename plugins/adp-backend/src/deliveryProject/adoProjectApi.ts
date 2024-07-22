import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import {
  tokenProviderRef,
  type TokenProvider,
} from '@internal/plugin-credentials-context-backend';
import { fetchApiRef, type FetchApi } from '@internal/plugin-fetch-api-backend';

export type IAdoProjectApi = { [P in keyof AdoProjectApi]: AdoProjectApi[P] };
export type AdoProjectOptions = {
  config: Config;
  fetchApi: FetchApi;
  tokens: TokenProvider;
};
export class AdoProjectApi {
  readonly #apiBaseUrl: string;
  readonly #fetchApi: FetchApi;
  readonly #tokens: TokenProvider;

  constructor(options: AdoProjectOptions) {
    this.#apiBaseUrl = options.config.getString('adp.adoProject.apiBaseUrl');
    this.#fetchApi = options.fetchApi;
    this.#tokens = options.tokens;
  }

  async checkIfAdoProjectExists(projectName: string): Promise<boolean> {
    const endpoint = `${this.#apiBaseUrl}/${projectName}`;
    const { token } = await this.#tokens.getLimitedUserToken();

    const response = await this.#fetchApi.fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ADO Project details for project ${projectName} - ${response.status} ${response.statusText}`,
      );
    }
    return response.ok;
  }
}

export const adoProjectApiRef = createServiceRef<IAdoProjectApi>({
  id: 'adp.adoprojectapi',
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
          return new AdoProjectApi(deps);
        },
      }),
    );
  },
});
