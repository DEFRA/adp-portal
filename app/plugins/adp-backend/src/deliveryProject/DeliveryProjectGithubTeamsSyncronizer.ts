import { InputError } from '@backstage/errors';
import { IDeliveryProjectStore } from './deliveryProjectStore';
import { GithubTeamDetails, IGitHubTeamsApi } from './GitHubTeamsApi';
import { IDeliveryProgrammeStore } from '../deliveryProgramme';

export type DeliveryProjectTeamsSyncResult = {
  contributors: GithubTeamDetails;
  admins: GithubTeamDetails;
};

export interface IDeliveryProjectGithubTeamsSyncronizer {
  syncronize(projectName: string): Promise<DeliveryProjectTeamsSyncResult>;
}

export class DeliveryProjectGithubTeamsSyncronizer
  implements IDeliveryProjectGithubTeamsSyncronizer
{
  readonly #githubTeams: IGitHubTeamsApi;
  readonly #deliveryProjects: IDeliveryProjectStore;
  readonly #deliveryProgrammes: IDeliveryProgrammeStore;

  public constructor(
    githubTeams: IGitHubTeamsApi,
    deliveryProjects: IDeliveryProjectStore,
    deliveryProgrammes: IDeliveryProgrammeStore,
  ) {
    this.#githubTeams = githubTeams;
    this.#deliveryProjects = deliveryProjects;
    this.#deliveryProgrammes = deliveryProgrammes;
  }

  async syncronize(
    projectName: string,
  ): Promise<DeliveryProjectTeamsSyncResult> {
    const teamConfig = await this.#getDeliveryProjectTeamConfig(projectName);

    return await this.#syncGithubTeams(teamConfig);
  }

  async #getDeliveryProjectTeamConfig(projectName: string) {
    const deliveryProject = await this.#deliveryProjects.getByName(projectName);
    if (deliveryProject === null)
      throw new InputError(`Unknown delivery project ${projectName}`);

    const deliveryProgramme = await this.#deliveryProgrammes.get(
      deliveryProject.delivery_programme_id,
    );
    if (deliveryProgramme === null)
      throw new InputError(
        `Unknown delivery programme ${deliveryProject.delivery_programme_id}`,
      );

    return {
      projectName: deliveryProject.name,
      programmeName: deliveryProgramme.name,
      visibility: deliveryProject.github_team_visibility ?? 'public',
      description: deliveryProject.description,
      // TODO: Load in the tech users & admins - AB#277055
    };
  }

  async #syncGithubTeams(teamConfig: {
    projectName: string;
    programmeName: string;
    visibility: 'public' | 'private';
    description: string;
  }): Promise<DeliveryProjectTeamsSyncResult> {
    const [contributors, admins] = await Promise.all([
      this.#githubTeams.setTeam(
        `ADP-${teamConfig.programmeName}-${teamConfig.projectName}-Contributors`,
        {
          description: teamConfig.description,
          isPublic: teamConfig.visibility === 'public',
          // TODO add tech users - AB#277055
        },
      ),
      this.#githubTeams.setTeam(
        `ADP-${teamConfig.programmeName}-${teamConfig.projectName}-Admins`,
        {
          description: teamConfig.description,
          isPublic: teamConfig.visibility === 'public',
          // TODO add tech admins - AB#277055
        },
      ),
    ]);

    return {
      contributors,
      admins,
    };
  }
}
