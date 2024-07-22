import {
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import {
  tokenProviderRef,
  type TokenProvider,
} from '@internal/plugin-credentials-context-backend';
import { fetchApiRef, type FetchApi } from '@internal/plugin-fetch-api-backend';

export type IEntraIdApi = {
  [P in keyof EntraIdApi]: EntraIdApi[P];
};

type GroupMembersRequest = {
  techUserMembers: string[];
  nonTechUserMembers: string[];
  adminMembers: string[];
};

export type EntraGroup = {
  displayName: string;
  type: number;
  description?: string;
  groupMemberships: string[];
  members: string[];
};

export type EntraIdApiOptions = {
  config: Config;
  fetchApi: FetchApi;
  tokens: TokenProvider;
};

export class EntraIdApi {
  readonly #fetchApi: FetchApi;
  readonly #apiBaseUrl: string;
  readonly #tokens: TokenProvider;

  constructor(options: EntraIdApiOptions) {
    this.#apiBaseUrl = options.config.getString('adp.entraIdGroups.apiBaseUrl');
    this.#fetchApi = options.fetchApi;
    this.#tokens = options.tokens;
  }

  async createEntraIdGroupsForProjectIfNotExists(
    members: DeliveryProjectUser[],
    projectName: string,
  ): Promise<void> {
    const existing = await this.getEntraIdGroups(projectName);

    if (existing.length === 0) {
      await this.createEntraIdGroupsForProject(members, projectName);
    }
  }

  async createEntraIdGroupsForProject(
    members: DeliveryProjectUser[],
    projectName: string,
  ): Promise<void> {
    const endpoint = `${this.#apiBaseUrl}/${projectName}/groups-config`;
    const body = this.#mapProjectUsers(members);
    const { token } = await this.#tokens.getLimitedUserToken();

    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to create Entra ID groups for project ${projectName} - ${response.status} ${response.statusText}`,
      );
    }
  }

  async setProjectGroupMembers(
    members: DeliveryProjectUser[],
    projectName: string,
  ): Promise<void> {
    const endpoint = `${this.#apiBaseUrl}/${projectName}/members`;
    const body = this.#mapProjectUsers(members);
    const { token } = await this.#tokens.getLimitedUserToken();

    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to set Entra ID group members for project ${projectName} - ${response.status} ${response.statusText}`,
      );
    }
  }

  async getEntraIdGroups(projectName: string): Promise<EntraGroup[]> {
    const endpoint = `${this.#apiBaseUrl}/${projectName}/groups-config`;
    const { token } = await this.#tokens.getLimitedUserToken();

    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to get Entra ID group members for project ${projectName} - ${response.status} ${response.statusText}`,
      );
    }

    const entraIdGroups = (await response.json()) as EntraGroup[];

    return entraIdGroups;
  }

  #mapProjectUsers(projectUsers: DeliveryProjectUser[]) {
    return projectUsers.reduce(
      (result: GroupMembersRequest, user: DeliveryProjectUser) => {
        if (!user.aad_user_principal_name) return result;
        if (user.is_admin)
          result.adminMembers.push(user.aad_user_principal_name);
        if (user.is_technical)
          result.techUserMembers.push(user.aad_user_principal_name);
        else result.nonTechUserMembers.push(user.aad_user_principal_name);
        return result;
      },
      { techUserMembers: [], nonTechUserMembers: [], adminMembers: [] },
    );
  }
}

export const entraIdApiRef = createServiceRef<IEntraIdApi>({
  id: 'adp.entraidapi',
  scope: 'plugin',
  defaultFactory(service) {
    return Promise.resolve(
      createServiceFactory({
        service,
        deps: {
          config: coreServices.rootConfig,
          fetchApi: fetchApiRef,
          tokens: tokenProviderRef,
        },
        factory(deps) {
          return new EntraIdApi(deps);
        },
      }),
    );
  },
});
