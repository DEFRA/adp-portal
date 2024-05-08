import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import type { ScmIntegrationRegistry } from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { AzureDevOpsApi } from './AzureDevOpsApi';

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
            description: 'The ID of the created pipeline',
          },
          pipelineUrl: {
            title: 'Pipeline URL',
            type: 'string',
            description: 'URL to the created pipeline',
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

      const pipeline = await adoApi.createPipeline(
        { organization, project: ctx.input.project },
        ctx.input.pipelineName,
        ctx.input.folder,
        ctx.input.repositoryName,
        ctx.input.serviceConnectionId,
        ctx.input.yamlPath ?? '/azure-pipelines.yaml',
        ctx.input.pipelineApiVersion,
      );

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
