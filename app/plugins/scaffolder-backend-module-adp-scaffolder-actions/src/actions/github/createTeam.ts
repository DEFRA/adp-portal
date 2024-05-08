import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import type {
  ScmIntegrationRegistry} from '@backstage/integration';
import {
  DefaultGithubCredentialsProvider,
} from '@backstage/integration';
import type { RequestError } from 'octokit';
import { Octokit } from 'octokit';
import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';

export function createGithubTeamAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  const { integrations, config } = options;
  return createTemplateAction<{
    githubTeamName: string;
    githubTeamDescription?: string;
    orgName?: string;
    users: string;
    visibility: 'secret' | 'closed';
  }>({
    id: 'adp:github:team:create',
    description:
      'Creates a GitHub Team in the organization to add as collaborator',
    schema: {
      input: {
        type: 'object',
        required: ['githubTeamName'],
        properties: {
          githubTeamName: {
            title: 'Team name to be created in GitHub organization',
            description: 'Schema for github team name',
            type: 'string',
          },
          githubTeamDescription: {
            title: 'GitHub Team description',
            description: 'Schema for github team description',
            type: 'string',
          },
          orgName: {
            title: 'GitHub organization name',
            description: 'Schema for github org name',
            type: 'string',
          },
          users: {
            title: 'List of usernames to be added to the GitHub team',
            description: 'Schema for github users',
            type: 'string',
          },
          visibility: {
            title: 'visibility to be given to the GitHub team',
            description: 'Schema for visibility',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const {
        githubTeamName,
        githubTeamDescription,
        orgName,
        users,
        visibility,
      } = ctx.input;

      const credentialsProvider =
        DefaultGithubCredentialsProvider.fromIntegrations(integrations);
      const organization = orgName ?? config.getString('github.organization');
      const url = `https://${config.getString('github.host')}/${organization}`;
      const credentials = await credentialsProvider.getCredentials({
        url: url,
      });

      if (credentials === undefined) {
        throw new InputError(
          `No credentials provided for ${url}. Check your integrations config.`,
        );
      }

      const octokit = new Octokit({
        auth: credentials.token,
      });

      let teamCreated = await checkTeamExists(
        octokit,
        organization,
        githubTeamName,
        ctx,
      );

      if (!teamCreated) {
        teamCreated = await createTeam(
          octokit,
          organization,
          githubTeamName,
          githubTeamDescription ?? '',
          visibility,
          ctx,
        );
      }

      if (teamCreated && users !== undefined && users.length > 0) {
        const usernames = `${users},adp-platform`.split(',').map(s => s.trim());
        await addUsersToTeam(
          octokit,
          organization,
          githubTeamName,
          usernames,
          ctx,
        );
      }
    },
  });
}

async function checkTeamExists(
  octokit: Octokit,
  organization: string,
  githubTeamName: string,
  ctx: any,
) {
  let teamCreated;
  try {
    const team = await octokit.rest.teams.getByName({
      org: organization,
      team_slug: githubTeamName,
    });
    if (team.status === 200) {
      ctx.logger.info(
        `Team ${ctx.input.githubTeamName} already exists in github org ${organization}`,
      );
      teamCreated = true;
    }
  } catch (error) {
    ctx.logger.error(`Error in getting GitHub team: ${error}`);
    if ((error as RequestError).status === 404) {
      teamCreated = false;
    }
  }
  return teamCreated;
}

async function createTeam(
  octokit: Octokit,
  organization: string,
  githubTeamName: string,
  githubTeamDescription: string,
  visibility: 'secret' | 'closed',
  ctx: any,
) {
  let teamCreated;
  try {
    const createdTeam = await octokit.rest.teams.create({
      org: organization,
      name: githubTeamName,
      description: githubTeamDescription,
      privacy: visibility,
    });
    if (createdTeam.status === 201) {
      ctx.logger.info(
        `Created team ${ctx.input.githubTeamName} in github org ${organization}`,
      );
      teamCreated = true;
    }
  } catch (err) {
    ctx.logger.error(
      `Creating team ${githubTeamName} failed with error: ${err}`,
    );
    throw new InputError(`Creating team failed`);
  }
  return teamCreated;
}

async function addUsersToTeam(
  octokit: Octokit,
  organization: string,
  githubTeamName: string,
  usernames: string[],
  ctx: any,
) {
  await Promise.all(
    usernames.map(async user => {
      try {
        const userAdded =
          await octokit.rest.teams.addOrUpdateMembershipForUserInOrg({
            org: organization,
            team_slug: githubTeamName,
            username: user,
          });
        if (userAdded.status === 200) {
          ctx.logger.info(`Added user ${user} to the team successfully`);
        }
      } catch (err) {
        ctx.logger.error(
          `Adding user ${user} to the team failed with error: ${err}`,
        );
        throw new InputError(
          `Adding user to the team failed with error: ${err}`,
        );
      }
    }),
  );
}
