import type {
  DeliveryProjectUser,
  CreateDeliveryProjectUserRequest,
  UpdateDeliveryProjectUserRequest,
  DeleteDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';
import type { DeliveryProjectUserApi } from './DeliveryProjectUserApi';
import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { ValidationError } from '../../../utils/ValidationError';

export class DeliveryProjectUserClient implements DeliveryProjectUserApi {
  readonly #discoveryApi: DiscoveryApi;
  readonly #fetchApi: FetchApi;

  constructor(discoveryApi: DiscoveryApi, fetchApi: FetchApi) {
    this.#discoveryApi = discoveryApi;
    this.#fetchApi = fetchApi;
  }

  async getAll(): Promise<DeliveryProjectUser[]> {
    const url = await this.#getBaseUrl();

    const response = await this.#fetchApi.fetch(url);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProjectUsers = asProjectUsers(await response.json());

    for (const item of deliveryProjectUsers)
      item.updated_at = new Date(item.updated_at);

    return deliveryProjectUsers;
  }

  async getByDeliveryProjectId(
    deliveryProjectId: string,
  ): Promise<DeliveryProjectUser[]> {
    const baseUrl = await this.#getBaseUrl();
    const url = `${baseUrl}/${deliveryProjectId}`;
    const response = await this.#fetchApi.fetch(url);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProgrammeAdmins = asProjectUsers(await response.json());

    return deliveryProgrammeAdmins;
  }

  async create(
    data: CreateDeliveryProjectUserRequest,
  ): Promise<DeliveryProjectUser> {
    const url = await this.#getBaseUrl();

    const response = await this.#fetchApi.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await this.#handleCreateUpdateResponse(response);
  }

  async update(
    data: UpdateDeliveryProjectUserRequest,
  ): Promise<DeliveryProjectUser> {
    const url = await this.#getBaseUrl();

    const response = await this.#fetchApi.fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return await this.#handleCreateUpdateResponse(response);
  }

  async #getBaseUrl(): Promise<string> {
    return `${await this.#discoveryApi.getBaseUrl('adp')}/deliveryProjectUsers`;
  }

  async #handleCreateUpdateResponse(
    response: Response,
  ): Promise<DeliveryProjectUser> {
    if (response.status === 400)
      throw new ValidationError((await response.json()).errors);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return asProjectUser(await response.json());
  }

  async delete(
    deliveryProjectUserId: string,
    deliveryProjectId: string,
  ): Promise<void> {
    const url = await this.#getBaseUrl();

    const body: DeleteDeliveryProjectUserRequest = {
      delivery_project_user_id: deliveryProjectUserId,
      delivery_project_id: deliveryProjectId,
    };

    const response = await this.#fetchApi.fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
  }
}

function asProjectUsers(result: DeliveryProjectUser[]) {
  return result.map(asProjectUser);
}

function asProjectUser(result: DeliveryProjectUser) {
  result.updated_at = new Date(result.updated_at);
  return result;
}
