import { DiscoveryService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import fetch from 'node-fetch';
import { DeliveryProjectTeamsSyncResult } from './githubTeam';

export interface AdpClientOptions {
  discoveryApi: DiscoveryService;
  fetchApi?: typeof fetch;
}

export type IAdpClient = { [P in keyof AdpClient]: AdpClient[P] };

export class AdpClient {
  readonly #discoveryApi: DiscoveryService;
  readonly #fetch: typeof fetch;

  constructor({ discoveryApi, fetchApi = fetch }: AdpClientOptions) {
    this.#discoveryApi = discoveryApi;
    this.#fetch = fetchApi;
  }

  public async syncDeliveryProjectWithGithubTeams(deliveryProjectName: string) {
    const baseUrl = await this.#discoveryApi.getBaseUrl('adp');
    const endpoint = `${baseUrl}/deliveryProject/${deliveryProjectName}/github/teams/sync`;
    const response = await this.#fetch(endpoint, {
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
