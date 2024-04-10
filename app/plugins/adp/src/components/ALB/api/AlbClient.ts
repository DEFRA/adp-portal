import { ArmsLengthBodyApi } from './AlbApi';
import { ArmsLengthBody } from '@internal/plugin-adp-common';

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';

export class ArmsLengthBodyClient implements ArmsLengthBodyApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(discoveryApi: DiscoveryApi, fetchApi: FetchApi) {
    this.discoveryApi = discoveryApi;
    this.fetchApi = fetchApi;
  }

  private async getApiUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('adp')}/armsLengthBody`;
  }

  async getArmsLengthBodies(): Promise<ArmsLengthBody[]> {
    try {
      const url = await this.getApiUrl();
      const response = await this.fetchApi.fetch(url);
      if (!response.ok) {
        throw await ResponseError.fromResponse(response);
      }
      return response.json();
    } catch (error) {
      throw new Error('Failed to fetch arms length bodies: ${error.message}');
    }
  }

  async createArmsLengthBody(data: any): Promise<ArmsLengthBody[]> {
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

  async updateArmsLengthBody(data: any): Promise<ArmsLengthBody[]> {
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

    const updatedData: ArmsLengthBody[] = await response.json();
    return updatedData;
  }

  async getArmsLengthBodyNames(): Promise<Record<string, string>> { 
    try {
      const albNamesUrl = `${await this.discoveryApi.getBaseUrl('adp')}/armslengthbodynames`;
  
      const response = await this.fetchApi.fetch(albNamesUrl);
      if (!response.ok) {
        throw await ResponseError.fromResponse(response);
      }
      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch arms length bodies`); 
    }
  }
}

export type { ArmsLengthBodyApi };
