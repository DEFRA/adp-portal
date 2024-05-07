import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import type { DeliveryProgrammeAdminApi } from './DeliveryProgrammeAdminApi';

export class DeliveryProgrammeAdminClient
  implements DeliveryProgrammeAdminApi
{
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
    aadEntityRefIds: string[],
  ): Promise<DeliveryProgrammeAdmin[]> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/deliveryProgrammeAdmin/${deliveryProgrammeId}`;

    const body = {
      aadEntityRefIds: aadEntityRefIds
    };

    const response = await this.fetchApi.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const deliveryProgrammeAdmins =
      (await response.json()) as DeliveryProgrammeAdmin[];

    return deliveryProgrammeAdmins;
  }

  async delete(
    aadEntityRefId: string,
    deliveryProgrammeId: string,
  ) {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/deliveryProgrammeAdmin`;

    const body = {
      aadEntityRefId: aadEntityRefId,
      deliveryProgrammeId: deliveryProgrammeId
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
