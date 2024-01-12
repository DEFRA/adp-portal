import { Config } from '@backstage/config';
import {
  DefaultAzureDevOpsCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  getHandlerFromToken,
  getPersonalAccessTokenHandler,
} from 'azure-devops-node-api';
import { InputError, ServiceUnavailableError } from '@backstage/errors';
import { IRequestOptions, RestClient } from 'typed-rest-client';
import { ServiceEndpointResponse } from './types';

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
    description: 'Gets a service connection from an ADO project',
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
      const {
        server,
        organization,
        project,
        serviceConnectionName,
        serviceEndpointApiVersion,
      } = ctx.input;

      const apiVersion = serviceEndpointApiVersion ?? '7.2-preview.4';
      const validServer = server ?? config.getString('azureDevOps.host');
      const validOrganization =
        organization ?? config.getString('azureDevOps.organization');

      const encodedOrganization = encodeURIComponent(validOrganization);
      const encodedProject = encodeURIComponent(project);

      const url = `https://${validServer}/${encodedOrganization}`;

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
        `Calling Azure DevOps REST API. Getting service connection ${serviceConnectionName} in project ${project}`,
      );

      const restClient = new RestClient(
        'backstage-scaffolder',
        `https://${validServer}`,
        [authHandler],
      );
      const requestOptions: IRequestOptions = {
        acceptHeader: 'application/json',
      };
      const resource = `/${encodedOrganization}/${encodedProject}/_apis/serviceendpoint/endpoints?endpointNames=${serviceConnectionName}&api-version=${apiVersion}`;

      ctx.logger.debug(`Calling resource ${resource} at host ${validServer}`);

      const serviceConnectionResponse =
        await restClient.get<ServiceEndpointResponse>(resource, requestOptions);

      if (
        !serviceConnectionResponse?.result ||
        serviceConnectionResponse.statusCode < 200 ||
        serviceConnectionResponse.statusCode > 299
      ) {
        const message = serviceConnectionResponse?.statusCode
          ? `Could not get response from resource ${resource}. Status code ${serviceConnectionResponse.statusCode}`
          : `Could not get response from resource ${resource}.`;
        throw new ServiceUnavailableError(message);
      }

      const serviceConnections = serviceConnectionResponse.result;

      if (serviceConnections.count < 1) {
        throw new InputError(
          `Unable to find service connection named ${serviceConnectionName} in project ${project}`,
        );
      }

      ctx.logger.info(
        `Service connection found. ID ${serviceConnections.value[0].id}`,
      );
      ctx.output('serviceConnectionId', serviceConnections.value[0].id);
    },
  });
}
