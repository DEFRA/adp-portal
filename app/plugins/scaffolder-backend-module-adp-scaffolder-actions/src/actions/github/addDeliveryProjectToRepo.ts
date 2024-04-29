import { Logger } from 'winston';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Octokit } from 'octokit';
import { Config } from '@backstage/config';
import { IAdpClient } from '@internal/plugin-adp-backend';

export function addDeliveryProjectToRepo(options: {
  config: Config;
  getGithubClient: (organization: string) => Promise<Octokit>;
  adpClient: IAdpClient;
}) {
  const { config, getGithubClient, adpClient } = options;
  return createTemplateAction<{
    projectName: string;
    repoName: string;
    orgName?: string;
    owner: string;
  }>({
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

      const teams = await adpClient.syncDeliveryProjectWithGithubTeams(
        projectName,
      );

      await addTeamsToRepository(ctx.logger, orgName, repoName, owner, {
        [teams.contributors.slug]: 'push',
        [teams.admins.slug]: 'admin',
        [getPlatformAdminsSlug(config)]: 'admin',
      });
    },
  });

  function getOrganisation(config: Config) {
    return config.getString('github.organization');
  }

  function getPlatformAdminsSlug(config: Config) {
    return config.getString('github.platformAdmins');
  }

  async function addTeamsToRepository(
    logger: Logger,
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
