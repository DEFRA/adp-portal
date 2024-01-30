import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { ResourceOptions } from './types';
import { AzureDevOpsApi } from './AzureDevOpsApi';

type PermitPipelineOptions = {
  pipelineApiVersion?: string;
  server?: string;
  organization?: string;
  project: string;
  pipelineId: number;
  resources: ResourceOptions[];
};

export function permitPipelineAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  const { integrations, config } = options;

  return createTemplateAction<PermitPipelineOptions>({
    id: 'adp:azure:pipeline:permit',
    description: 'Authorizes access to resources for a pipeline',
    schema: {
      input: {
        required: ['project', 'pipelineId', 'resources'],
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
              'The name of the Azure DevOps project where the pipeline has been created.',
          },
          pipelineId: {
            type: 'number',
            title: 'Pipeline ID',
            description:
              'The ID of the pipeline requesting access to the resource',
          },
          resources: {
            type: 'array(object)',
            title: 'Resources',
            description:
              'A collection of resources to authorize. Required properties: resourceId (string), resourceType (string), authorized (boolean)',
          },
        },
      },
      output: {},
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

      const permittedResources = await adoApi.permitPipeline(
        { organization, project: ctx.input.project },
        ctx.input.pipelineId,
        ctx.input.resources,
        ctx.input.pipelineApiVersion,
      );

      if (!permittedResources) {
        throw new InputError('Unable to permit pipeline resources');
      }

      ctx.logger.info(
        `Updated resource permissions in pipeline ${ctx.input.pipelineId}`,
      );
    },
  });
}
