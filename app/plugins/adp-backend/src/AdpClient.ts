import type {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import type {
  DeliveryProjectTeamsSyncResult,
  IAdpClient,
} from '@internal/plugin-adp-common';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';

export interface AdpClientOptions {
  discoveryApi: DiscoveryService;
  fetchApi: FetchApi;
  credentials: BackstageCredentials;
  auth: AuthService;
}

export class AdpClient implements IAdpClient {
  readonly #discoveryApi: DiscoveryService;
  readonly #fetchApi: FetchApi;
  readonly #credentials: BackstageCredentials;
  readonly #auth: AuthService;

  constructor({ discoveryApi, fetchApi, credentials, auth }: AdpClientOptions) {
    this.#discoveryApi = discoveryApi;
    this.#fetchApi = fetchApi;
    this.#credentials = credentials;
    this.#auth = auth;
  }

  public async syncDeliveryProjectWithGithubTeams(deliveryProjectName: string) {
    const baseUrl = await this.#discoveryApi.getBaseUrl('adp');
    const { token } = await this.#auth.getPluginRequestToken({
      onBehalfOf: this.#credentials,
      targetPluginId: 'adp',
    });
    const endpoint = `${baseUrl}/deliveryProject/${deliveryProjectName}/github/teams/sync`;
    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new InputError(
        'Failed to sync the delivery project with github teams',
      );
    }

    return (await response.json()) as DeliveryProjectTeamsSyncResult;
  }
}
