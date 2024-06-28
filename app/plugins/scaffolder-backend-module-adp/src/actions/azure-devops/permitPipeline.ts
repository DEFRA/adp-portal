import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import type { ScmIntegrationRegistry } from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import type { AuthorizedResources, ResourceOptions } from './types';
import { AzureDevOpsApi } from './AzureDevOpsApi';

export type PermitPipelineActionInput = {
  pipelineApiVersion?: string;
  server?: string;
  organization?: string;
  project: string;
  pipelineId: number;
  resources: AuthorizedResources;
};

export function permitPipelineAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  const { integrations, config } = options;

  return createTemplateAction<PermitPipelineActionInput>({
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
            type: 'object',
            title: 'Resources',
            description:
              'An object containing the resources to authorise. Required format {"serviceConnectionIds": [], "variableGroupIds": [], "agentQueueIds": [], "environmentIds": []}',
          },
        },
      },
      output: {},
    },

    async handler(ctx) {
      const server = ctx.input.server ?? config.getString('azureDevOps.host');
      const organization =
        ctx.input.organization ?? config.getString('azureDevOps.organization');

      const serviceConnections =
        ctx.input.resources.serviceConnectionIds?.map<ResourceOptions>(
          serviceConnection => ({
            resourceId: serviceConnection,
            resourceType: 'endpoint',
            authorized: true,
          }),
        ) ?? [];
      const environments =
        ctx.input.resources.environmentIds?.map<ResourceOptions>(
          environment => ({
            resourceId: environment.toString(),
            resourceType: 'environment',
            authorized: true,
          }),
        ) ?? [];
      const variableGroups =
        ctx.input.resources.variableGroupIds?.map<ResourceOptions>(
          variableGroup => ({
            resourceId: variableGroup.toString(),
            resourceType: 'variablegroup',
            authorized: true,
          }),
        ) ?? [];
      const agentQueues =
        ctx.input.resources.agentQueueIds?.map<ResourceOptions>(agentQueue => ({
          resourceId: agentQueue.toString(),
          resourceType: 'queue',
          authorized: true,
        })) ?? [];

      const resources = [
        ...serviceConnections,
        ...environments,
        ...variableGroups,
        ...agentQueues,
      ];

      const adoApi = await AzureDevOpsApi.fromIntegrations(
        integrations,
        config,
        { organization: organization, server: server },
        { logger: ctx.logger },
      );

      const permittedResources = await adoApi.permitPipeline(
        { organization, project: ctx.input.project },
        ctx.input.pipelineId,
        resources,
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
