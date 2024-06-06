import type { Config } from '@backstage/config';
import type { ScmIntegrationRegistry } from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { InputError } from '@backstage/errors';
import { AzureDevOpsApi } from './AzureDevOpsApi';

type GetServiceConnectionOptions = {
  serviceEndpointApiVersion?: string;
  server?: string;
  organization?: string;
  project: string;
  serviceConnectionName: string;
};

export function getServiceConnectionAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  const { integrations, config } = options;

  return createTemplateAction<GetServiceConnectionOptions>({
    id: 'adp:azure:serviceconnection:get',
    description: 'Gets a service connection from an Azure DevOps project',
    schema: {
      input: {
        required: ['project', 'serviceConnectionName'],
        type: 'object',
        properties: {
          serviceEndpointApiVersion: {
            type: 'string',
            title: 'API Version',
            description:
              'The Service Endpoint API version to use. Defaults to 7.2-preview.4',
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
          serviceConnectionName: {
            type: 'string',
            title: 'Service Connection Name',
            description: 'The name of the service connection',
          },
        },
      },
      output: {
        required: ['serviceConnectionId'],
        type: 'object',
        properties: {
          serviceConnectionId: {
            type: 'string',
            title: 'Service Connection ID',
            description: 'The Service Connection ID',
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
      const serviceConnections = await adoApi.getServiceConnections(
        { organization, project: ctx.input.project },
        ctx.input.serviceConnectionName,
        ctx.input.serviceEndpointApiVersion,
      );

      if (!serviceConnections || serviceConnections.count < 1) {
        throw new InputError(
          `Unable to find service connection named ${ctx.input.serviceConnectionName} in project ${ctx.input.project}`,
        );
      }

      ctx.logger.info(
        `Service connection found. ID ${serviceConnections.value[0].id}`,
      );
      ctx.output('serviceConnectionId', serviceConnections.value[0].id);
    },
  });
}
