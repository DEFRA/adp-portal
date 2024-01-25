import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  ScmIntegrationRegistry,
  DefaultGithubCredentialsProvider,
} from '@backstage/integration';
import { Octokit, RequestError } from 'octokit';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';

export function addGithubTeamToRepoAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  const { integrations, config } = options;
  return createTemplateAction<{
    teamNames: string;
    repoName: string;
    orgName?: string;
    owner: string;
    permission: 'pull' | 'triage' | 'push' | 'maintain' | 'admin';
  }>({
    id: 'adp:github:team:add',
    description: 'Adds a GitHub Team to the git repository as collaborator',
    schema: {
      input: {
        type: 'object',
        required: ['teamNames', 'repoName', 'owner'],
        properties: {
          teamNames: {
            title: 'List of team names to be added to the git repository',
            description: 'Schema for github team name',
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
          permission: {
            title:
              'Permission to be given to the GitHub team on git repository',
            description: 'Schema for permission',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const { teamNames, repoName, orgName, owner, permission } =
        ctx.input;

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

      const teams = teamNames.split(',').map(t => t.trim());
      const teamResponse = await Promise.all(
        teams.map(async team => {
          let exists = await checkTeamExists(octokit, organization, team, ctx);
          return { team: team, exists: exists };
        }),
      );
      const availableTeams = teamResponse
        .filter(data => data.exists)
        .map(data => data.team);
      await Promise.all(
        availableTeams.map(
          async team =>
            await addTeamToRepo(
              octokit,
              organization,
              repoName,
              owner,
              team,
              permission,
              ctx,
            ),
        ),
      );
    },
  });
}

async function checkTeamExists(
  octokit: Octokit,
  organization: string,
  githubTeamName: string,
  ctx,
) {
  let isTeamExists: boolean = false;
  try {
    const team = await octokit.rest.teams.getByName({
      org: organization,
      team_slug: githubTeamName,
    });
    if (team.status === 200) {
      ctx.logger.info(
        `Team ${githubTeamName} exists in github org ${organization}`,
      );
      isTeamExists = true;
    }
  } catch (error) {
    if ((error as unknown as RequestError).status === 404) {
      ctx.logger.info(`GitHub team ${githubTeamName} doesn't exist in the org`);
    } else {
      ctx.logger.error(`Error in getting GitHub team: ${error}`);
    }
    isTeamExists = false;
  }
  return isTeamExists;
}

async function addTeamToRepo(
  octokit: Octokit,
  organization: string,
  repoName: string,
  owner: string,
  team: string,
  permission: string,
  ctx,
) {
  try {
    let teamAdded = await octokit.rest.teams.addOrUpdateRepoPermissionsInOrg({
      org: organization,
      team_slug: team,
      owner: owner,
      repo: repoName,
      permission: permission,
    });
    if (teamAdded.status === 204) {
      ctx.logger.info(
        `Added team ${team} to the repo ${repoName} successfully`,
      );
    }
  } catch (err) {
    ctx.logger.error(
      `Adding team ${team} to the repo ${repoName} failed with error: ${err}`,
    );
    throw new InputError(`Adding team to the repo failed with error: ${err}`);
  }
}
