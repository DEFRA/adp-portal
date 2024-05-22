import type { DiscoveryService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import type {
  DeliveryProjectTeamsSyncResult,
  IAdpClient,
} from '@internal/plugin-adp-common';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';

export interface AdpClientOptions {
  discoveryApi: DiscoveryService;
  fetchApi: FetchApi;
}

export class AdpClient implements IAdpClient {
  readonly #discoveryApi: DiscoveryService;
  readonly #fetchApi: FetchApi;

  constructor({ discoveryApi, fetchApi }: AdpClientOptions) {
    this.#discoveryApi = discoveryApi;
    this.#fetchApi = fetchApi;
  }

  public async syncDeliveryProjectWithGithubTeams(deliveryProjectName: string) {
    const baseUrl = await this.#discoveryApi.getBaseUrl('adp');
    const endpoint = `${baseUrl}/deliveryProject/${deliveryProjectName}/github/teams/sync`;
    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'PUT',
    });

    if (!response.ok) {
      throw new InputError(
        'Failed to sync the delivery project with github teams',
      );
    }

    return (await response.json()) as DeliveryProjectTeamsSyncResult;
  }
}
