import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import type { ScmIntegrationRegistry } from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { BuildStatus } from './types';
import type { Logger } from 'winston';
import { AzureDevOpsApi } from './AzureDevOpsApi';

type RunPipelineOptions = {
  pipelineApiVersion?: string;
  buildApiVersion?: string;
  server?: string;
  organization?: string;
  project: string;
  pipelineId: number;
  branch?: string;
  pipelineParameters?: object;
};

/** Interval for polling the Get Build endpoint */
const GET_BUILD_INTERVAL = 5000;

export function runPipelineAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  const { integrations, config } = options;

  return createTemplateAction<RunPipelineOptions>({
    id: 'adp:azure:pipeline:run',
    description: 'Runs an Azure DevOps pipeline',
    schema: {
      input: {
        required: ['project', 'pipelineId'],
        type: 'object',
        properties: {
          runApiVersion: {
            type: 'string',
            title: 'Run API Version',
            description:
              'The Pipeline API version to use. Defaults to 7.2-preview.1',
          },
          buildApiVersion: {
            type: 'string',
            title: 'Build API Version',
            description:
              'The Build API version to use. Defaults to 7.2-preview.7',
          },
          server: {
            type: 'string',
            title: 'Server',
            description:
              'The hostname of the Azure DevOps service. Defaults to the azureDevOps.host config setting',
          },
          organization: {
            type: 'string',
            title: 'Organization',
            description:
              'The name of the Azure DevOps organization. Defaults to the azureDevOps.organization config setting',
          },
          project: {
            type: 'string',
            title: 'Project',
            description:
              'The name of the Azure DevOps project containing the service connection',
          },
          pipelineId: {
            type: 'number',
            title: 'Pipeline ID',
            description: 'The pipeline ID',
          },
          branch: {
            type: 'string',
            title: 'Build Branch',
            description: 'The repository branch to build. Defaults to main',
          },
          pipelineParameters: {
            type: 'object',
            title: 'Pipeline Parameters',
            description: 'Parameters passed in to the pipeline run',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          buildRunUrl: {
            type: 'string',
            title: 'Build Run URL',
            description: 'The URL to the build run',
          },
        },
      },
    },

    async handler(ctx) {
      const server = ctx.input.server ?? config.getString('azureDevOps.host');
      const organization =
        ctx.input.organization ?? config.getString('azureDevOps.organization');

      const adoApi = await AzureDevOpsApi.fromIntegrations(
        integrations,
        config,
        { organization: organization, server: server },
        { logger: ctx.logger },
      );

      const pipelineRun = await adoApi.runPipeline(
        { organization, project: ctx.input.project },
        ctx.input.pipelineId,
        ctx.input.pipelineParameters as Record<string, string>,
        ctx.input.branch,
        ctx.input.pipelineApiVersion,
      );

      if (!pipelineRun) {
        throw new InputError(
          `Unable to run pipeline ${ctx.input.pipelineId} in project ${ctx.input.project}`,
        );
      }

      ctx.logger.info(`Started pipeline run: ${pipelineRun._links.web.href}`);
      ctx.output('buildId', pipelineRun.id);
      ctx.output('pipelineRunUrl', pipelineRun._links.web.href);

      const isPipelineRunComplete = await checkPipelineStatus(
        adoApi,
        organization,
        ctx.input.project,
        pipelineRun.id,
        ctx.logger,
        ctx.input.buildApiVersion,
      );

      if (isPipelineRunComplete) {
        ctx.logger.info('Pipeline run started');
      } else {
        ctx.logger.warn(
          `Pipeline run could not start. Check ${pipelineRun._links.web.href}`,
        );
      }
    },
  });
}

async function checkPipelineStatus(
  adoApi: AzureDevOpsApi,
  organization: string,
  project: string,
  runId: number,
  logger: Logger,
  apiVersion?: string,
): Promise<boolean> {
  const build = await adoApi.getBuild(
    { organization, project },
    runId,
    apiVersion,
  );

  if (
    build.status === BuildStatus.Completed ||
    build.status === BuildStatus.InProgress
  ) {
    return true;
  } else if (build.status === BuildStatus.NotStarted) {
    // If pipeline hasn't started, wait and check again.
    logger.info(
      `Build not yet started. Waiting ${GET_BUILD_INTERVAL / 1000} seconds...`,
    );
    await new Promise(resolve => setTimeout(resolve, GET_BUILD_INTERVAL));
    return checkPipelineStatus(
      adoApi,
      organization,
      project,
      runId,
      logger,
      apiVersion,
    );
  }
  return false;
}
