import { Config } from '@backstage/config';
import {
  DefaultAzureDevOpsCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  WebApi,
  getHandlerFromToken,
  getPersonalAccessTokenHandler,
} from 'azure-devops-node-api';
import { InputError } from '@backstage/errors';

type GetServiceConnectionOptions = {
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
    description: 'Gets a service connection from an ADO project',
    schema: {
      input: {
        required: ['project', 'serviceConnectionName'],
        type: 'object',
        properties: {
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
      const { server, organization, project, serviceConnectionName } =
        ctx.input;

      const validServer = server ?? config.getString('azureDevOps.host');
      const validOrganization =
        organization ?? config.getString('azureDevOps.organization');
      const url = `https://${validServer}/${encodeURIComponent(
        validOrganization,
      )}`;

      const credentialsProvider =
        DefaultAzureDevOpsCredentialsProvider.fromIntegrations(integrations);
      const credentials = await credentialsProvider.getCredentials({
        url: url,
      });

      if (credentials === undefined) {
        throw new InputError(`No credentials provided for ${url}. Check your integrations config.`);
      }

      let authHandler;
      if (!credentials || credentials.type === 'pat') {
        const token = config.getString('azureDevOps.token');
        authHandler = getPersonalAccessTokenHandler(token);
      } else {
        authHandler = getHandlerFromToken(credentials.token);
      }

      ctx.logger.info(
        `Calling Azure DevOps REST API. Getting service connection ${serviceConnectionName} in project ${project}`,
      );

      const webApi = new WebApi(url, authHandler);
      const coreClient = await webApi.getCoreApi();

      const serviceConnection = await coreClient.getConnectedServiceDetails(
        project,
        serviceConnectionName,
      );

      if (!serviceConnection?.id) {
        throw new InputError(
          `Unable to find service connection named ${serviceConnectionName} in project ${project}`,
        );
      }

      ctx.logger.info(`Service connection found. ID ${serviceConnection.id}`)

      ctx.output('serviceConnectionId', serviceConnection.id);
    },
  });
}
