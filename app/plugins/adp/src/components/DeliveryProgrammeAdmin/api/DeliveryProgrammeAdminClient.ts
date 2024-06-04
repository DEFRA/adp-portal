import type {
  CreateDeliveryProgrammeAdminRequest,
  DeleteDeliveryProgrammeAdminRequest,
  DeliveryProgrammeAdmin,
} from '@internal/plugin-adp-common';
import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import type { DeliveryProgrammeAdminApi } from './DeliveryProgrammeAdminApi';
import { ValidationError } from '../../../utils/ValidationError';

export class DeliveryProgrammeAdminClient implements DeliveryProgrammeAdminApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(discoveryApi: DiscoveryApi, fetchApi: FetchApi) {
    this.discoveryApi = discoveryApi;
    this.fetchApi = fetchApi;
  }

  public async getByDeliveryProgrammeId(
    deliveryProgrammeId: string,
  ): Promise<DeliveryProgrammeAdmin[]> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/deliveryProgrammeAdmins/${deliveryProgrammeId}`;

    const response = await this.fetchApi.fetch(url);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProgrammeAdmins =
      (await response.json()) as DeliveryProgrammeAdmin[];

    return deliveryProgrammeAdmins;
  }

  async getAll(): Promise<DeliveryProgrammeAdmin[]> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/deliveryProgrammeAdmins/`;

    const response = await this.fetchApi.fetch(url);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProgrammeAdmins =
      (await response.json()) as DeliveryProgrammeAdmin[];

    return deliveryProgrammeAdmins;
  }

  async create(
    deliveryProgrammeId: string,
    userCatalogName: string,
    groupEntityRef: string,
  ): Promise<DeliveryProgrammeAdmin> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/deliveryProgrammeAdmin`;

    const body: CreateDeliveryProgrammeAdminRequest = {
      user_catalog_name: userCatalogName,
      delivery_programme_id: deliveryProgrammeId,
      group_entity_ref: groupEntityRef,
    };

    const response = await this.fetchApi.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 400)
      throw new ValidationError((await response.json()).errors);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProgrammeAdmin =
      (await response.json()) as DeliveryProgrammeAdmin;

    return deliveryProgrammeAdmin;
  }

  async delete(aadEntityRefId: string, deliveryProgrammeId: string) {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/deliveryProgrammeAdmin`;

    const body: DeleteDeliveryProgrammeAdminRequest = {
      aadEntityRefId: aadEntityRefId,
      deliveryProgrammeId: deliveryProgrammeId,
    };

    const response = await this.fetchApi.fetch(url, {
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

  private async getBaseUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('adp')}`;
  }
}
