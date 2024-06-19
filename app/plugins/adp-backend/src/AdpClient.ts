import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  type AuthService,
  type DiscoveryService,
} from '@backstage/backend-plugin-api';
import { ResponseError } from '@backstage/errors';
import type {
  DeliveryProjectTeamsSyncResult,
  IAdpClient,
} from '@internal/plugin-adp-common';
import {
  credentialsProviderRef,
  type CredentialsProvider,
} from '@internal/plugin-credentials-context-backend';
import { fetchApiRef, type FetchApi } from '@internal/plugin-fetch-api-backend';

export interface AdpClientOptions {
  discoveryApi: DiscoveryService;
  fetchApi: FetchApi;
  auth: AuthService;
  credentials: CredentialsProvider;
}

export class AdpClient implements IAdpClient {
  readonly #discoveryApi: DiscoveryService;
  readonly #fetchApi: FetchApi;
  readonly #auth: AuthService;
  readonly #credentials: CredentialsProvider;

  constructor({ discoveryApi, fetchApi, auth, credentials }: AdpClientOptions) {
    this.#discoveryApi = discoveryApi;
    this.#fetchApi = fetchApi;
    this.#auth = auth;
    this.#credentials = credentials;
  }

  public async syncDeliveryProjectWithGithubTeams(deliveryProjectName: string) {
    const baseUrl = await this.#discoveryApi.getBaseUrl('adp');
    const endpoint = `${baseUrl}/deliveryProjects/${deliveryProjectName}/github/teams/sync`;
    const { token } = await this.#auth.getPluginRequestToken({
      onBehalfOf: this.#credentials.current,
      targetPluginId: 'adp',
    });
    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return (await response.json()) as DeliveryProjectTeamsSyncResult;
  }
}

export const adpClientRef = createServiceRef<IAdpClient>({
  id: 'adp-backend.adpClient',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          discoveryApi: coreServices.discovery,
          auth: coreServices.auth,
          fetchApi: fetchApiRef,
          credentials: credentialsProviderRef,
        },
        factory(deps) {
          return new AdpClient(deps);
        },
      }),
    );
  },
});
