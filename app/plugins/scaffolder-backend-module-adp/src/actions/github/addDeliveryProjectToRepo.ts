import type { LoggerService } from '@backstage/backend-plugin-api';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import type { Octokit } from 'octokit';
import type { Config } from '@backstage/config';
import type { IAdpClient } from '@internal/plugin-adp-common';

export type AddDeliveryProjectToRepoInput = {
  projectName: string;
  repoName: string;
  orgName?: string;
  owner: string;
};

export function addDeliveryProjectToRepo(options: {
  config: Config;
  getGithubClient: (organization: string) => Promise<Octokit>;
  adpClient: IAdpClient;
}) {
  const { config, getGithubClient, adpClient } = options;
  return createTemplateAction<AddDeliveryProjectToRepoInput>({
    id: 'adp:github:team:add:deliveryproject',
    description: 'Adds the teams of a delivery project to a github repository',
    schema: {
      input: {
        type: 'object',
        required: ['repoName', 'owner', 'projectName'],
        properties: {
          projectName: {
            title:
              'The name of the delivery project whos teams should be added.',
            description: 'Schema for delivery project name',
            type: 'string',
          },
          repoName: {
            title: 'GitHub repository name',
            description: 'Schema for github repo name',
            type: 'string',
          },
          orgName: {
            title: 'GitHub organization name',
            description: 'Schema for github org name',
            type: 'string',
          },
          owner: {
            title: 'Owner of the github repository',
            description: 'Schema for github repo owner name',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const {
        projectName,
        repoName,
        orgName = getOrganisation(config),
        owner,
      } = ctx.input;

      const teams =
        await adpClient.syncDeliveryProjectWithGithubTeams(projectName);

      await addTeamsToRepository(ctx.logger, orgName, repoName, owner, {
        [teams.contributors.slug]: 'push',
        [teams.admins.slug]: 'admin',
        [getPlatformAdminsSlug(config)]: 'admin',
      });
    },
  });

  async function addTeamsToRepository(
    logger: LoggerService,
    organization: string,
    repoName: string,
    owner: string,
    teams: Record<string, 'pull' | 'triage' | 'push' | 'maintain' | 'admin'>,
  ) {
    const client = await getGithubClient(organization);
    const result = await Promise.allSettled(
      Object.entries(teams).map(async ([name, role]) => {
        await client.rest.teams.addOrUpdateRepoPermissionsInOrg({
          org: organization,
          owner,
          repo: repoName,
          team_slug: name,
          permission: role,
        });
      }),
    );

    const failed = result.filter(
      (x): x is Extract<typeof x, { status: 'rejected' }> =>
        x.status === 'rejected',
    );
    if (failed.length > 0) {
      for (const { reason } of failed) {
        logger.error(String(reason));
      }
      throw new Error('Failed to add the teams to the repository');
    }
  }
}

function getOrganisation(config: Config) {
  return config.getString('github.organization');
}

function getPlatformAdminsSlug(config: Config) {
  return config.getString('github.platformAdmins');
}
