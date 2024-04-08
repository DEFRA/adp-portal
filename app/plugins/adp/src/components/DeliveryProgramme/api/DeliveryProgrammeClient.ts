import { DeliveryProgrammeApi } from './DeliveryProgrammeApi';
import {
  DeliveryProgramme,
  ProgrammeManager,
} from '@internal/plugin-adp-common';

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';

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

  private async getManagerApiUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('adp')}/programmeManager`;
  }

  async getDeliveryProgrammes(): Promise<DeliveryProgramme[]> {
    try {
      const url = await this.getApiUrl();

      const albNamesUrl = `${await this.discoveryApi.getBaseUrl(
        'adp',
      )}/armslengthbodynames`;

      const [deliveryProgrammesResponse, albNamesResponse] = await Promise.all([
        this.fetchApi.fetch(url),
        this.fetchApi.fetch(albNamesUrl),
      ]);

      if (!deliveryProgrammesResponse.ok || !albNamesResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [deliveryProgrammes, albNamesMapping] = await Promise.all([
        deliveryProgrammesResponse.json(),
        albNamesResponse.json(),
      ]);

      const deliveryProgrammesWithNames = deliveryProgrammes.map(
        (programme: { arms_length_body_id: string | number }) => ({
          ...programme,

          arms_length_body_id_name:
            albNamesMapping[programme.arms_length_body_id] ||
            'Unknown ALB Name',
        }),
      );

      return deliveryProgrammesWithNames;
    } catch (error) {
      throw new Error(`Failed to fetch Delivery Programmes`);
    }
  }

  async createDeliveryProgramme(data: any): Promise<DeliveryProgramme[]> {
    const url = await this.getApiUrl();
    const response = await this.fetchApi.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json();
  }

  async updateDeliveryProgramme(data: any): Promise<DeliveryProgramme[]> {
    const url = await this.getApiUrl();

    const response = await this.fetchApi.fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    const updatedData: DeliveryProgramme[] = await response.json();
    return updatedData;
  }

  async getDeliveryProgrammeById(id: string): Promise<DeliveryProgramme> {
    try {
      const url = await this.getApiUrl();
      const response = await this.fetchApi.fetch(`${url}/${id}`);
      if (!response.ok) {
        throw await ResponseError.fromResponse(response);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch Delivery Programme by ID`);
    }
  }

  async getProgrammeManagers(): Promise<ProgrammeManager[]> {
    try {
      const url = await this.getManagerApiUrl();
      const response = await this.fetchApi.fetch(url);
      if (!response.ok) {
        throw await ResponseError.fromResponse(response);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch Delivery Programme Managers`);
    }
  }
}

export type { DeliveryProgrammeApi };
