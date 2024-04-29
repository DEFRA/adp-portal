import { InputError } from '@backstage/errors';
import { IDeliveryProjectStore } from '../deliveryProject/deliveryProjectStore';
import {
  GithubTeamDetails,
  IGitHubTeamsApi,
  SetTeamRequest,
} from './GithubTeamsApi';
import { DeliveryProject } from '@internal/plugin-adp-common';
import { IGithubTeamStore } from '.';
import { createGithubTeamDetails } from '../utils';

export type DeliveryProjectTeamsSyncResult = {
  contributors: GithubTeamDetails;
  admins: GithubTeamDetails;
};

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
  readonly #githubTeamsStore: IGithubTeamStore;

  public constructor(
    githubTeamsApi: IGitHubTeamsApi,
    deliveryProjects: IDeliveryProjectStore,
    githubTeamsStore: IGithubTeamStore,
  ) {
    this.#githubTeamsApi = githubTeamsApi;
    this.#deliveryProjects = deliveryProjects;
    this.#githubTeamsStore = githubTeamsStore;
  }

  async syncronize(
    projectName: string,
  ): Promise<DeliveryProjectTeamsSyncResult> {
    const teamConfig = await this.#getDeliveryProjectTeamConfig(projectName);

    const result = await this.#syncGithubTeams(teamConfig);

    await this.#githubTeamsStore.set(teamConfig.deliveryProjectId, result);

    return result;
  }

  async #getDeliveryProjectTeamConfig(
    projectName: string,
  ): Promise<TeamConfigs> {
    const deliveryProject = await this.#deliveryProjects.getByName(projectName);
    if (deliveryProject === null)
      throw new InputError(`Unknown delivery project ${projectName}`);

    console.log(this.#githubTeamsStore);

    const teamDetails = createGithubTeamDetails(deliveryProject);
    const teamIds = await this.#githubTeamsStore.get(deliveryProject.id);

    return {
      deliveryProjectId: deliveryProject.id,
      teams: {
        admins: {
          ...teamDetails.admins,
          id: teamIds.admins?.id,
          visibility: deliveryProject.github_team_visibility ?? 'public',
          // TODO: Load in the tech users & admins - AB#277055
          maintainers: undefined,
          members: undefined,
        },
        contributors: {
          ...teamDetails.contributors,
          id: teamIds.contributors?.id,
          visibility: deliveryProject.github_team_visibility ?? 'public',
          // TODO: Load in the tech users & admins - AB#277055
          maintainers: undefined,
          members: undefined,
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
