import type {
  DeliveryProjectUser,
  CreateDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';
import type { DeliveryProjectUserApi } from './DeliveryProjectUserApi';
import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { ValidationError } from '../../../utils/ValidationError';

export class DeliveryProjectUserClient implements DeliveryProjectUserApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(discoveryApi: DiscoveryApi, fetchApi: FetchApi) {
    this.discoveryApi = discoveryApi;
    this.fetchApi = fetchApi;
  }

  async getAll(): Promise<DeliveryProjectUser[]> {
    const baseUrl = await this.#getBaseUrl();
    const url = `${baseUrl}/deliveryProjectUsers/`;

    const response = await this.fetchApi.fetch(url);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProjectUsers =
      (await response.json()) as DeliveryProjectUser[];

    return deliveryProjectUsers;
  }

  async getByDeliveryProjectId(
    deliveryProjectId: string,
  ): Promise<DeliveryProjectUser[]> {
    const baseUrl = await this.#getBaseUrl();
    const url = `${baseUrl}/deliveryProjectUsers/${deliveryProjectId}`;

    const response = await this.fetchApi.fetch(url);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProgrammeAdmins =
      (await response.json()) as DeliveryProjectUser[];

    return deliveryProgrammeAdmins;
  }

  async create(
    data: CreateDeliveryProjectUserRequest,
  ): Promise<DeliveryProjectUser> {
    const baseUrl = await this.#getBaseUrl();
    const url = `${baseUrl}/deliveryProjectUser`;

    const response = await this.fetchApi.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.status === 400)
      throw new ValidationError((await response.json()).errors);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProgrammeAdmin =
      (await response.json()) as DeliveryProjectUser;

    return deliveryProgrammeAdmin;
  }

  async #getBaseUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('adp')}`;
  }
}
