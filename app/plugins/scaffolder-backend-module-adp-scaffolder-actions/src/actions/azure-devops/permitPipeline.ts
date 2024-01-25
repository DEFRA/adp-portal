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

type PermitPipelineOptions = {
  pipelineApiVersion?: string;
  server?: string;
  organization?: string;
  project: string;
  pipelineId: number;
  resources: ResourceOptions[];
};

type ResourceOptions = {
  resourceType: string;
  resourceId: string;
  authorized: boolean;
};

type PermitPipelineRequest = {
  pipelines: [
    {
      id: number;
      authorized: boolean;
    },
  ];
  resource: {
    id: string;
    name?: string;
    type: string;
  };
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
        `Calling Azure DevOps REST API. Permitting resources for pipeline ${ctx.input.pipelineId} in project ${ctx.input.project}`,
      );

      const restClient = new RestClient(
        'backstage-scaffolder',
        `https://${server}`,
        [authHandler],
      );
      const requestOptions: IRequestOptions = {
        acceptHeader: 'application/json',
      };
      const resource = `/${encodedOrganization}/${encodedProject}/_apis/pipelines/pipelinepermissions?api-version=${apiVersion}`;
      const body: PermitPipelineRequest[] =
        ctx.input.resources.map<PermitPipelineRequest>(res => ({
          pipelines: [
            {
              id: ctx.input.pipelineId,
              authorized: res.authorized,
            },
          ],
          resource: {
            id: res.resourceId,
            type: res.resourceType,
          },
        }));

      ctx.logger.debug(`Calling resource ${resource} at host ${server}`);

      const permitPipelineResponse = await restClient.update(
        resource,
        body,
        requestOptions,
      );

      if (!permitPipelineResponse) {
        throw new ServiceUnavailableError(
          `Could not get response from resource ${resource}`,
        );
      }

      if (
        permitPipelineResponse.statusCode < 200 ||
        permitPipelineResponse.statusCode > 299
      ) {
        const message = permitPipelineResponse?.statusCode
          ? `Could not set pipeline permissions. Status code ${permitPipelineResponse.statusCode}`
          : `Could not set pipeline permissions.`;
        ctx.logger.warn(message);
      } else {
        ctx.logger.info('Successfully changed pipeline permissions');
      }
    },
  });
}
