import { Config } from '@backstage/config';
import { InputError, ServiceUnavailableError } from '@backstage/errors';
import {
  DefaultAzureDevOpsCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  getPersonalAccessTokenHandler,
  getHandlerFromToken,
} from 'azure-devops-node-api';
import { IRequestOptions, RestClient } from 'typed-rest-client';
import { Pipeline } from './types';

type CreatePipelineOptions = {
  pipelineApiVersion?: string;
  server?: string;
  organization?: string;
  project: string;
  folder: string;
  pipelineName: string;
  repositoryName: string;
  yamlPath?: string;
  serviceConnectionId: string;
};

type Repository = {
  fullName: string;
  connection: {
    id: string;
  };
  type: string;
};

type CreatePipelineConfiguration = {
  type: string;
  path: string;
  repository: Repository;
};

type CreatePipelineRequest = {
  folder: string;
  name: string;
  configuration: CreatePipelineConfiguration;
};

export function createPipelineAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  const { integrations, config } = options;

  return createTemplateAction<CreatePipelineOptions>({
    id: 'adp:azure:pipeline:create',
    description: 'Creates an Azure DevOps pipeline',
    schema: {
      input: {
        required: [
          'project',
          'folder',
          'pipelineName',
          'repositoryName',
          'serviceConnectionId',
        ],
        type: 'object',
        properties: {
          pipelineApiVersion: {
            type: 'string',
            title: 'API Version',
            description:
              'The Pipeline Endpoint API version to use. Defaults to 7.2-preview.1.',
          },
          server: {
            type: 'string',
            title: 'Server',
            description:
              'The hostname of the Azure DevOps service. Defaults to the azureDevOps.host config setting.',
          },
          organization: {
            type: 'string',
            title: 'Organization',
            description:
              'The name of the Azure DevOps organization. Defaults to the azureDevOps.organization config setting.',
          },
          project: {
            type: 'string',
            title: 'Project',
            description:
              'The name of the Azure DevOps project where the pipeline will be created',
          },
          folder: {
            type: 'string',
            title: 'Folder',
            description:
              'The name of the folder where the pipeline will be created.',
          },
          pipelineName: {
            type: 'string',
            title: 'Pipeline Name',
            description: 'The name of the pipeline.',
          },
          repositoryName: {
            type: 'string',
            title: 'Repository Name',
            description:
              'The name of the GitHub repository. This must be in the format owner-name/repo-name',
          },
          yamlPath: {
            type: 'string',
            title: 'Azure DevOps Pipelines Definition',
            description:
              'The location of the Azure DevOps Pipeline definition file. Defaults to /azure-pipelines.yaml',
          },
          serviceConnectionId: {
            title: 'Service Connection ID',
            type: 'string',
            description:
              'The ID of the service connection for the GitHub repository.',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          pipelineId: {
            title: 'Pipeline ID',
            type: 'number',
            description: 'The ID of the created pipeline'
          },
          pipelineUrl: {
            title: 'Pipeline URL',
            type: 'string',
            description: 'URL to the created pipeline'
          }
        }
      },
    },

    async handler(ctx) {
      const apiVersion = ctx.input.pipelineApiVersion ?? '7.2-preview.1';
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

      ctx.logger.info(
        `Calling Azure DevOps REST API. Creating pipeline ${ctx.input.pipelineName} in project ${ctx.input.project}`,
      );

      const restClient = new RestClient(
        'backstage-scaffolder',
        `https://${server}`,
        [authHandler],
      );
      const requestOptions: IRequestOptions = {
        acceptHeader: 'application/json',
      };
      const resource = `/${encodedOrganization}/${encodedProject}/_apis/pipelines?api-version=${apiVersion}`;
      const body: CreatePipelineRequest = {
        folder: ctx.input.folder,
        name: ctx.input.pipelineName,
        configuration: {
          path: ctx.input.yamlPath || '/azure-pipelines.yaml',
          type: 'yaml',
          repository: {
            fullName: ctx.input.repositoryName,
            type: 'github',
            connection: {
              id: ctx.input.serviceConnectionId,
            },
          },
        },
      };

      ctx.logger.debug(`Calling resource ${resource} at host ${server}`);

      const createPipelineResponse = await restClient.create<Pipeline>(
        resource,
        body,
        requestOptions,
      );

      if (
        !createPipelineResponse ||
        createPipelineResponse.statusCode < 200 ||
        createPipelineResponse.statusCode > 299
      ) {
        const message = createPipelineResponse?.statusCode
          ? `Could not get response from resource ${resource}. Status code ${createPipelineResponse.statusCode}`
          : `Could not get response from resource ${resource}.`;
        throw new ServiceUnavailableError(message);
      }

      const pipeline = createPipelineResponse.result;

      if (!pipeline) {
        throw new InputError(
          `Unable to create new pipeline in project ${ctx.input.project}`,
        );
      }

      ctx.logger.info(`Pipeline created. Pipeline ID is ${pipeline.id}`);
      ctx.output('pipelineId', pipeline.id);
      ctx.output('pipelineUrl', pipeline._links.web.href);
    },
  });
}
