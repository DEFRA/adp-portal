import type { IDeliveryProjectStore } from '../deliveryProject/deliveryProjectStore';
import type { IGitHubTeamsApi, SetTeamRequest } from './GithubTeamsApi';
import type {
  DeliveryProject,
  DeliveryProjectTeamsSyncResult,
  DeliveryProjectUser,
  GithubTeamDetails,
} from '@internal/plugin-adp-common';
import { createGithubTeamDetails } from '../utils';
import type { IGithubTeamStore } from './GithubTeamStore';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';

export type IDeliveryProjectGithubTeamsSyncronizer = {
  [P in keyof DeliveryProjectGithubTeamsSyncronizer]: DeliveryProjectGithubTeamsSyncronizer[P];
};

type TeamConfigs = {
  deliveryProjectId: string;
  teams: Record<'contributors' | 'admins', TeamConfig>;
};

type TeamConfig = {
  id?: number;
  description: string;
  visibility: Required<DeliveryProject['github_team_visibility']>;
  name: string;
  maintainers?: string[];
  members?: string[];
};

export class DeliveryProjectGithubTeamsSyncronizer
  implements IDeliveryProjectGithubTeamsSyncronizer
{
  readonly #githubTeamsApi: IGitHubTeamsApi;
  readonly #deliveryProjects: IDeliveryProjectStore;
  readonly #deliveryProjectUsers: IDeliveryProjectUserStore;
  readonly #githubTeamsStore: IGithubTeamStore;

  public constructor(
    githubTeamsApi: IGitHubTeamsApi,
    deliveryProjects: IDeliveryProjectStore,
    githubTeamsStore: IGithubTeamStore,
    deliveryProjectUsersStore: IDeliveryProjectUserStore,
  ) {
    this.#githubTeamsApi = githubTeamsApi;
    this.#deliveryProjects = deliveryProjects;
    this.#githubTeamsStore = githubTeamsStore;
    this.#deliveryProjectUsers = deliveryProjectUsersStore;
  }

  async syncronizeById(
    projectId: string,
  ): Promise<DeliveryProjectTeamsSyncResult> {
    const deliveryProject = await this.#deliveryProjects.get(projectId);
    return await this.#syncronize(deliveryProject);
  }

  async syncronizeByName(
    projectName: string,
  ): Promise<DeliveryProjectTeamsSyncResult> {
    const deliveryProject = await this.#deliveryProjects.getByName(projectName);
    return await this.#syncronize(deliveryProject);
  }

  async #syncronize(
    deliveryProject: DeliveryProject,
  ): Promise<DeliveryProjectTeamsSyncResult> {
    const teamConfig = await this.#getDeliveryProjectTeamConfig(
      deliveryProject,
    );

    const result = await this.#syncGithubTeams(teamConfig);

    await this.#githubTeamsStore.set(teamConfig.deliveryProjectId, result);

    return result;
  }

  async #getDeliveryProjectTeamConfig(
    deliveryProject: DeliveryProject,
  ): Promise<TeamConfigs> {
    const deliveryProjectUsers =
      await this.#deliveryProjectUsers.getByDeliveryProject(deliveryProject.id);
    const teamDetails = createGithubTeamDetails(deliveryProject);
    const teamIds = await this.#githubTeamsStore.get(deliveryProject.id);

    const adminUsernames = deliveryProjectUsers.reduce(
      (usernames: string[], user: DeliveryProjectUser) => {
        if (user.github_username !== undefined && user.is_admin)
          usernames.push(user.github_username);
        return usernames;
      },
      [],
    );

    const contributorUsernames = deliveryProjectUsers.reduce(
      (usernames: string[], user: DeliveryProjectUser) => {
        if (user.github_username !== undefined && !user.is_admin)
          usernames.push(user.github_username);
        return usernames;
      },
      [],
    );

    return {
      deliveryProjectId: deliveryProject.id,
      teams: {
        admins: {
          ...teamDetails.admins,
          id: teamIds.admins?.id,
          visibility: deliveryProject.github_team_visibility ?? 'public',
          maintainers: undefined,
          members: adminUsernames,
        },
        contributors: {
          ...teamDetails.contributors,
          id: teamIds.contributors?.id,
          visibility: deliveryProject.github_team_visibility ?? 'public',
          maintainers: undefined,
          members: contributorUsernames,
        },
      },
    };
  }

  async #syncGithubTeam(teamConfig: TeamConfig): Promise<GithubTeamDetails> {
    const { name, id, maintainers, members, description, visibility } =
      teamConfig;

    const request: SetTeamRequest = {
      name,
      description,
      isPublic: visibility === 'public',
      maintainers,
      members,
    };

    return await (id === undefined
      ? this.#githubTeamsApi.createTeam(request)
      : this.#githubTeamsApi.setTeam(id, request));
  }

  async #syncGithubTeams(
    teamConfig: TeamConfigs,
  ): Promise<DeliveryProjectTeamsSyncResult> {
    const [contributors, admins] = await Promise.all([
      this.#syncGithubTeam(teamConfig.teams.contributors),
      this.#syncGithubTeam(teamConfig.teams.admins),
    ]);

    return {
      admins,
      contributors,
    };
  }
}
