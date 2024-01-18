import { Config } from '@backstage/config';
import { InputError, ServiceUnavailableError } from '@backstage/errors';
import {
  DefaultAzureDevOpsCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  getHandlerFromToken,
  getPersonalAccessTokenHandler,
} from 'azure-devops-node-api';
import { IRequestOptions, RestClient } from 'typed-rest-client';
import { Build, BuildStatus, PipelineRun } from './types';
import { Logger } from 'winston';

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

type RunPipelineRequest = {
  templateParameters?: Record<string, string>;
  yamlOverrides?: object;
  resources: {
    repositories: {
      self: {
        refName: string;
      };
    };
  };
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

      const encodedOrganization = encodeURIComponent(organization);
      const encodedProject = encodeURIComponent(ctx.input.project);

      const url = `https://${server}/${encodedOrganization}`;

      const credentialsProvider =
        DefaultAzureDevOpsCredentialsProvider.fromIntegrations(integrations);
      const credentials = await credentialsProvider.getCredentials({
        url: url,
      });

      if (credentials === undefined) {
        throw new InputError(
          `No credentials provided for ${url}. Check your integrations config.`,
        );
      }

      let authHandler;
      if (!credentials || credentials.type === 'pat') {
        const token = config.getString('azureDevOps.token');
        authHandler = getPersonalAccessTokenHandler(token);
      } else {
        authHandler = getHandlerFromToken(credentials.token);
      }

      const restClient = new RestClient(
        'backstage-scaffolder',
        `https://${server}`,
        [authHandler],
      );

      ctx.logger.info(
        `Calling Azure DevOps REST API. Running pipeline ${ctx.input.pipelineId} in project ${ctx.input.project}`,
      );

      const pipelineRun = await runPipeline(
        restClient,
        encodedOrganization,
        encodedProject,
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
        restClient,
        encodedOrganization,
        encodedProject,
        pipelineRun.id,
        ctx.input.buildApiVersion,
        ctx.logger,
      );

      if (isPipelineRunComplete) {
        ctx.logger.info('Pipeline run successfully completed');
      } else {
        ctx.logger.warn(
          `Pipeline run could not complete. Check ${pipelineRun._links.web.href}`,
        );
      }
    },
  });
}

async function runPipeline(
  client: RestClient,
  organization: string,
  project: string,
  pipelineId: number,
  parameters?: Record<string, string>,
  branch: string = 'main',
  apiVersion: string = '7.2-preview.1',
): Promise<PipelineRun | null> {
  const requestOptions: IRequestOptions = {
    acceptHeader: 'application/json',
  };

  const resource = `/${organization}/${project}/_apis/pipelines/${pipelineId}/runs?api-version=${apiVersion}`;
  const body: RunPipelineRequest = {
    resources: {
      repositories: {
        self: {
          refName: `refs/heads/${branch}`,
        },
      },
    },
    templateParameters: parameters,
  };

  const runPipelineResponse = await client.create<PipelineRun>(
    resource,
    body,
    requestOptions,
  );

  if (
    !runPipelineResponse ||
    runPipelineResponse.statusCode < 200 ||
    runPipelineResponse.statusCode > 299
  ) {
    const message = runPipelineResponse?.statusCode
      ? `Could not get response from resource ${resource}. Status code ${runPipelineResponse.statusCode}`
      : `Could not get response from resource ${resource}.`;
    throw new ServiceUnavailableError(message);
  }

  const pipelineRun = runPipelineResponse.result;

  return pipelineRun;
}

async function checkPipelineStatus(
  client: RestClient,
  organization: string,
  project: string,
  runId: number,
  apiVersion: string = '7.2-preview.7',
  logger: Logger,
): Promise<boolean> {
  logger.info(
    `Calling Azure DevOps REST API. Getting build ${runId} in project ${project}`,
  );

  const requestOptions: IRequestOptions = {
    acceptHeader: 'application/json',
  };
  const resource = `/${organization}/${project}/_apis/build/builds/${runId}?api-version=${apiVersion}`;

  const getBuildResponse = await client.get<Build>(resource, requestOptions);

  if (
    !getBuildResponse?.result ||
    getBuildResponse.statusCode < 200 ||
    getBuildResponse.statusCode > 299
  ) {
    const message = getBuildResponse?.statusCode
      ? `Could not get response from resource ${resource}. Status code ${getBuildResponse.statusCode}`
      : `Could not get response from resource ${resource}.`;
    throw new ServiceUnavailableError(message);
  }

  const build = getBuildResponse.result;
  if (build.status === BuildStatus.Completed) {
    return true;
  } else if (
    build.status === BuildStatus.InProgress ||
    build.status === BuildStatus.NotStarted
  ) {
    // If pipeline is still running or hasn't started, wait and check again.
    logger.info(`Build in progress. Waiting ${GET_BUILD_INTERVAL / 1000} seconds...`)
    await new Promise(resolve => setTimeout(resolve, GET_BUILD_INTERVAL));
    return checkPipelineStatus(
      client,
      organization,
      project,
      runId,
      apiVersion,
      logger,
    );
  } else {
    return false;
  }
}
