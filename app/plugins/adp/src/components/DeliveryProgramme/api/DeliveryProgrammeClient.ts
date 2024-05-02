import { DeliveryProgrammeApi } from './DeliveryProgrammeApi';
import {
  CreateDeliveryProgrammeRequest,
  DeliveryProgramme,
  DeliveryProgrammeAdmin,
  UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { ValidationError } from '../../../utils';

export class DeliveryProgrammeClient implements DeliveryProgrammeApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(discoveryApi: DiscoveryApi, fetchApi: FetchApi) {
    this.discoveryApi = discoveryApi;
    this.fetchApi = fetchApi;
  }

  private async getApiUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('adp')}/deliveryProgramme`;
  }

  private async getDeliveryProgrammeAdminApiUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl(
      'adp',
    )}/deliveryProgrammeAdmins`;
  }

  async getDeliveryProgrammes(): Promise<DeliveryProgramme[]> {
    const url = await this.getApiUrl();

    const albNamesUrl = `${await this.discoveryApi.getBaseUrl(
      'adp',
    )}/armslengthbodynames`;

    const [deliveryProgrammesResponse, albNamesResponse] = await Promise.all([
      this.fetchApi.fetch(url),
      this.fetchApi.fetch(albNamesUrl),
    ]);

    if (!deliveryProgrammesResponse.ok) {
      throw await ResponseError.fromResponse(deliveryProgrammesResponse);
    } else if (!albNamesResponse.ok) {
      throw await ResponseError.fromResponse(albNamesResponse);
    }

    const [deliveryProgrammes, albNamesMapping] = await Promise.all([
      deliveryProgrammesResponse.json(),
      albNamesResponse.json(),
    ]);

    const deliveryProgrammesWithNames = deliveryProgrammes.map(
      (programme: { arms_length_body_id: string | number }) => ({
        ...programme,

        arms_length_body_id_name:
          albNamesMapping[programme.arms_length_body_id] || 'Unknown ALB Name',
      }),
    );

    return deliveryProgrammesWithNames;
  }

  async createDeliveryProgramme(
    data: CreateDeliveryProgrammeRequest,
  ): Promise<DeliveryProgramme[]> {
    const url = await this.getApiUrl();
    const response = await this.fetchApi.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (response.ok) return await response.json();

    if (response.status === 400)
      throw new ValidationError((await response.json()).errors);

    throw await ResponseError.fromResponse(response);
  }

  async updateDeliveryProgramme(
    data: UpdateDeliveryProgrammeRequest,
  ): Promise<DeliveryProgramme[]> {
    const url = await this.getApiUrl();

    const response = await this.fetchApi.fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (response.ok) return await response.json();

    if (response.status === 400)
      throw new ValidationError((await response.json()).errors);

    throw await ResponseError.fromResponse(response);
  }

  async getDeliveryProgrammeById(id: string): Promise<DeliveryProgramme> {
    const url = await this.getApiUrl();
    const response = await this.fetchApi.fetch(`${url}/${id}`);
    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
    return await response.json();
  }

  async getDeliveryProgrammeAdmins(): Promise<DeliveryProgrammeAdmin[]> {
    const url = await this.getDeliveryProgrammeAdminApiUrl();
    const response = await this.fetchApi.fetch(url);
    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }
    return await response.json();
  }
}
