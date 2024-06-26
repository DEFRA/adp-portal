import type { ArmsLengthBodyApi } from './AlbApi';
import type {
  ArmsLengthBody,
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { ValidationError } from '../../../utils';

export class ArmsLengthBodyClient implements ArmsLengthBodyApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(discoveryApi: DiscoveryApi, fetchApi: FetchApi) {
    this.discoveryApi = discoveryApi;
    this.fetchApi = fetchApi;
  }

  private async getApiUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('adp')}/armsLengthBodies`;
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

  async createArmsLengthBody(
    data: CreateArmsLengthBodyRequest,
  ): Promise<ArmsLengthBody[]> {
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

  async updateArmsLengthBody(
    data: UpdateArmsLengthBodyRequest,
  ): Promise<ArmsLengthBody[]> {
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

  async getArmsLengthBodyNames(): Promise<Record<string, string>> {
    try {
      const albNamesUrl = `${await this.discoveryApi.getBaseUrl(
        'adp',
      )}/armslengthbodies/names`;

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
