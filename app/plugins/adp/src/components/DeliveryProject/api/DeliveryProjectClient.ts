import type { DeliveryProjectApi } from './DeliveryProjectApi';
import type {
  CheckAdoProjectExistsResponse,
  CreateDeliveryProjectRequest,
  DeliveryProgramme,
  DeliveryProject,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ForwardedError, ResponseError } from '@backstage/errors';
import { ValidationError } from '../../../utils';

export class DeliveryProjectClient implements DeliveryProjectApi {
  readonly #discoveryApi: DiscoveryApi;
  readonly #fetchApi: FetchApi;

  constructor(discoveryApi: DiscoveryApi, fetchApi: FetchApi) {
    this.#discoveryApi = discoveryApi;
    this.#fetchApi = fetchApi;
  }

  private async getApiUrl(): Promise<string> {
    return `${await this.#discoveryApi.getBaseUrl('adp')}/deliveryProjects`;
  }

  async getDeliveryProjects(): Promise<DeliveryProject[]> {
    try {
      const url = await this.getApiUrl();
      const deliveryProgrammeUrl = `${await this.#discoveryApi.getBaseUrl(
        'adp',
      )}/deliveryProgrammes`;

      const [deliveryProjectsResponse, deliveryProgrammeResponse] =
        await Promise.all([
          this.#fetchApi.fetch(url),
          this.#fetchApi.fetch(deliveryProgrammeUrl),
        ]);
      if (!deliveryProjectsResponse.ok || !deliveryProgrammeResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      const deliveryProjects = asDeliveryProjects(
        await deliveryProjectsResponse.json(),
      );
      const deliveryProgrammes = asDeliveryProgrammes(
        await deliveryProgrammeResponse.json(),
      );

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
    try {
      await this.#checkIfAdoProjectExists(data.ado_project);
    } catch (error) {
      throw new Error(
        'Project does not exist in the DEFRA organization ADO, please enter a valid ADO project name',
      );
    }
    const result = await this.#createDeliveryProjectCore(data);

    try {
      await this.#createEntraIdGroupsForProject(
        [],
        result.namespace.toUpperCase(),
      );
    } catch (error) {
      const err = error as Error;
      throw new ForwardedError(
        `Failed to create Entra ID groups for project ${result.namespace.toUpperCase()} - ${err.message}`,
        err,
      );
    }

    return result;
  }

  async #sendJson(method: string, url: string, body: unknown) {
    return await this.#fetchApi.fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  async #readResponse(response: Response): Promise<void>;
  async #readResponse<T>(
    response: Response,
    converter: (value: unknown) => T,
  ): Promise<T>;
  async #readResponse<T>(
    response: Response,
    converter?: (value: unknown) => T,
  ) {
    if (response.ok) return converter?.(await response.json());

    if (response.status === 400)
      throw new ValidationError((await response.json()).errors);

    throw await ResponseError.fromResponse(response);
  }

  async #createDeliveryProjectCore(
    data: CreateDeliveryProjectRequest,
  ): Promise<DeliveryProject> {
    const url = await this.getApiUrl();
    const response = await this.#sendJson('POST', url, data);
    return await this.#readResponse(response, asDeliveryProject);
  }

  async updateDeliveryProject(
    data: UpdateDeliveryProjectRequest,
  ): Promise<DeliveryProject> {
    try {
      if (data.ado_project) {
        await this.#checkIfAdoProjectExists(data.ado_project);
      }
    } catch (error) {
      throw new Error(
        'Project does not exist in the DEFRA organization ADO, please enter a valid ADO project name',
      );
    }
    const result = await this.updateDeliveryProjectCore(data);

    try {
      await this.#createEntraIdGroupsForProject(
        [],
        result.namespace.toUpperCase(),
      );
    } catch (error) {
      const err = error as Error;
      throw new ForwardedError(
        `Failed to create Entra ID groups for project ${result.namespace.toUpperCase()} - ${err.message}`,
        err,
      );
    }

    return result;
  }

  async updateDeliveryProjectCore(
    data: UpdateDeliveryProjectRequest,
  ): Promise<DeliveryProject> {
    const url = await this.getApiUrl();
    const response = await this.#sendJson('PATCH', url, data);
    return await this.#readResponse(response, asDeliveryProject);
  }

  async getDeliveryProjectById(id: string): Promise<DeliveryProject> {
    try {
      const url = await this.getApiUrl();
      const response = await this.#fetchApi.fetch(`${url}/${id}`);
      return await this.#readResponse(response, asDeliveryProject);
    } catch (error) {
      throw new Error(`Failed to fetch Delivery Project by ID`);
    }
  }

  async #createEntraIdGroupsForProject(
    data: any,
    projectName: string,
  ): Promise<void> {
    const url = await this.getApiUrl();
    const response = await this.#sendJson(
      'POST',
      `${url}/${projectName}/createEntraIdGroups`,
      data,
    );
    await this.#readResponse(response);
  }

  async #checkIfAdoProjectExists(adoProjectName: string): Promise<boolean> {
    const url = await this.getApiUrl();
    const response = await this.#fetchApi.fetch(
      `${url}/adoProject/${adoProjectName}`,
    );
    return (await this.#readResponse(response, asCheckAdoProjectExistsResponse))
      .exists;
  }
}

function asDeliveryProjects(value: unknown) {
  const result = value as unknown[];
  return result.map(asDeliveryProject);
}

function asDeliveryProject(value: unknown) {
  const result = value as DeliveryProject;
  result.updated_at = new Date(result.updated_at);
  result.created_at = new Date(result.created_at);
  return result;
}
function asDeliveryProgrammes(value: unknown) {
  const result = value as unknown[];
  return result.map(asDeliveryProgramme);
}

function asDeliveryProgramme(value: unknown) {
  const result = value as DeliveryProgramme;
  result.created_at = new Date(result.created_at);
  result.updated_at = new Date(result.updated_at);
  return result;
}

function asCheckAdoProjectExistsResponse(value: unknown) {
  return value as CheckAdoProjectExistsResponse;
}

export type { DeliveryProjectApi };
