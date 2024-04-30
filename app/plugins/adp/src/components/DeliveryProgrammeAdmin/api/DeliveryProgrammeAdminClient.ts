import { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { DeliveryProgrammeAdminApi } from './DeliveryProgrammeAdminApi';

export class DeliveryProgrammeAdminApiClient
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

  getAll(): Promise<DeliveryProgrammeAdmin[]> {
    throw new Error('Method not implemented.');
  }

  create(data: any): Promise<DeliveryProgrammeAdmin[]> {
    throw new Error('Method not implemented.');
  }

  delete(
    aadEntityRefId: string,
    deliveryProgrammeId: string,
  ): Promise<DeliveryProgrammeAdmin[]> {
    throw new Error('Method not implemented.');
  }

  private async getBaseUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('adp')}`;
  }
}
