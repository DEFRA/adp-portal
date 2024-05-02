import { DeliveryProjectApi } from './DeliveryProjectApi';
import {
  CreateDeliveryProjectRequest,
  DeliveryProgramme,
  DeliveryProject,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { ValidationError } from '../../../utils';

export class DeliveryProjectClient implements DeliveryProjectApi {
  private discoveryApi: DiscoveryApi;
  private fetchApi: FetchApi;

  constructor(discoveryApi: DiscoveryApi, fetchApi: FetchApi) {
    this.discoveryApi = discoveryApi;
    this.fetchApi = fetchApi;
  }

  private async getApiUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('adp')}/deliveryProject`;
  }

  private async getPortalApiBaseUrl(): Promise<string> {
    return `${await this.discoveryApi.getBaseUrl('proxy')}/adp-portal-api`;
  }

  async getDeliveryProjects(): Promise<DeliveryProject[]> {
    try {
      const url = await this.getApiUrl();
      const deliveryProgrammeUrl = `${await this.discoveryApi.getBaseUrl(
        'adp',
      )}/deliveryProgramme`;

      const [deliveryProjectsResponse, deliveryProgrammeResponse] =
        await Promise.all([
          this.fetchApi.fetch(url),
          this.fetchApi.fetch(deliveryProgrammeUrl),
        ]);
      if (!deliveryProjectsResponse.ok || !deliveryProgrammeResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      const deliveryProjects: DeliveryProject[] =
        await deliveryProjectsResponse.json();
      const deliveryProgrammes: DeliveryProgramme[] =
        await deliveryProgrammeResponse.json();

      const deliveryProjectWithProgramme = deliveryProjects.map(proj => {
        return {
          ...proj,
          delivery_programme_name: deliveryProgrammes.find(
            p => p.id === proj.delivery_programme_id,
          )?.title,
        };
      });
      return deliveryProjectWithProgramme;
    } catch (error) {
      throw new Error(`Failed to fetch Delivery Project`);
    }
  }

  async createDeliveryProject(
    data: CreateDeliveryProjectRequest,
  ): Promise<DeliveryProject> {
    if (!(await this.checkIfAdoProjectExists(data.ado_project))) {
      throw new Error(
        'Project does not exist in the DEFRA organization ADO, please enter a valid ADO project name',
      );
    }
    const result = await this.#createDeliveryProjectCore(data);

    const adGroupPayload = {
      members: [],
    };
    await this.createEntraIdGroupsForProject(
      adGroupPayload,
      result.namespace.toUpperCase(),
    );
    return result;
  }

  async #createDeliveryProjectCore(
    data: CreateDeliveryProjectRequest,
  ): Promise<DeliveryProject> {
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

  async updateDeliveryProject(
    data: UpdateDeliveryProjectRequest,
  ): Promise<DeliveryProject> {
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

  async getDeliveryProjectById(id: string): Promise<DeliveryProject> {
    try {
      const url = await this.getApiUrl();
      const response = await this.fetchApi.fetch(`${url}/${id}`);
      if (!response.ok) {
        throw await ResponseError.fromResponse(response);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch Delivery Project by ID`);
    }
  }

  private async createEntraIdGroupsForProject(
    data: any,
    projectName: string,
  ): Promise<void> {
    try {
      const adpPortalApiBaseUrl = await this.getPortalApiBaseUrl();
      const createAdGroupUrl = `${adpPortalApiBaseUrl}/AadGroup/${projectName}/groups-config`;
      const response = await this.fetchApi.fetch(createAdGroupUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await ResponseError.fromResponse(response);
      }
    } catch (error) {
      throw new Error(`Failed to create Entra ID Groups for Project`);
    }
  }

  private async checkIfAdoProjectExists(projectName: string): Promise<boolean> {
    try {
      const adpPortalApiBaseUrl = await this.getPortalApiBaseUrl();
      const getAdoProjectUrl = `${adpPortalApiBaseUrl}/AdoProject/${projectName}`;
      const response = await this.fetchApi.fetch(getAdoProjectUrl);

      if (!response.ok) {
        return Promise.resolve(false);
      }
      return Promise.resolve(true);
    } catch (error) {
      throw new Error(`Failed to fetch ADO Project details`);
    }
  }
}

export type { DeliveryProjectApi };
