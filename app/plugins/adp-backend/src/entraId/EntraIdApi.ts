import type { Config } from '@backstage/config';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import fetch from 'node-fetch';

export type IEntraIdApi = {
  [P in keyof EntraIdApi]: EntraIdApi[P];
};

type GroupMembersRequest = {
  techUserMembers: string[];
  nonTechUserMembers: string[];
  adminMembers: string[];
};

export class EntraIdApi {
  readonly #fetch: typeof fetch;
  readonly #apiBaseUrl: string;

  constructor(config: Config, fetchApi = fetch) {
    this.#apiBaseUrl = config.getString('adp.entraIdGroups.apiBaseUrl');
    this.#fetch = fetchApi;
  }

  async createEntraIdGroupsForProject(
    members: DeliveryProjectUser[],
    projectName: string,
  ): Promise<void> {
    const endpoint = `${this.#apiBaseUrl}/${projectName}/groups-config`;
    const body = this.#mapProjectUsers(members);

    const response = await this.#fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    const response = await this.#fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to set Entra ID group members for project ${projectName} - ${response.status} ${response.statusText}`,
      );
    }
  }

  #mapProjectUsers(projectUsers: DeliveryProjectUser[]) {
    return projectUsers.reduce(
      (result: GroupMembersRequest, user: DeliveryProjectUser) => {
        if (user.is_admin) result.adminMembers.push(user.email);
        else if (user.is_technical) result.techUserMembers.push(user.email);
        else result.nonTechUserMembers.push(user.email);
        return result;
      },
      { techUserMembers: [], nonTechUserMembers: [], adminMembers: [] },
    );
  }
}
