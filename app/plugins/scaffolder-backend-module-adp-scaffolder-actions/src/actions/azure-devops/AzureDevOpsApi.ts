import { Config } from '@backstage/config';
import { InputError, ServiceUnavailableError } from '@backstage/errors';
import {
  DefaultAzureDevOpsCredentialsProvider,
  ScmIntegrationRegistry,
} from '@backstage/integration';
import {
  getHandlerFromToken,
  getPersonalAccessTokenHandler,
} from 'azure-devops-node-api';
import { IRequestOptions, IRestResponse, RestClient } from 'typed-rest-client';
import { Logger } from 'winston';
import { ServiceEndpointResponse } from './types';
import { IRequestHandler } from 'typed-rest-client/Interfaces';

export class AzureDevOpsApi {
  private readonly restClient: RestClient;
  private readonly requestOptions: IRequestOptions;
  private readonly logger: Logger;

  private constructor(restClient: RestClient, logger: Logger) {
    this.restClient = restClient;
    this.logger = logger;
    this.requestOptions = {
      acceptHeader: 'application/json',
    };
  }

  static async fromIntegrations(
    scmIntegrations: ScmIntegrationRegistry,
    config: Config,
    azureDevOpsOptions: { server: string; organization: string },
    options: { logger: Logger },
  ): Promise<AzureDevOpsApi> {
    const encodedOrganization = encodeURIComponent(
      azureDevOpsOptions.organization,
    );
    const url = `https://${azureDevOpsOptions.server}/${encodedOrganization}`;

    const credentialsProvider =
      DefaultAzureDevOpsCredentialsProvider.fromIntegrations(scmIntegrations);
    const credentials = await credentialsProvider.getCredentials({
      url: url,
    });

    if (credentials === undefined) {
      throw new InputError(
        `No credentials provided for ${url}. Check your integrations config.`,
      );
    }

    let authHandler: IRequestHandler;
    if (!credentials || credentials.type === 'pat') {
      const token = config.getString('azureDevOps.token');
      authHandler = getPersonalAccessTokenHandler(token);
    } else {
      authHandler = getHandlerFromToken(credentials.token);
    }

    const restClient = new RestClient(
      'backstage-scaffolder',
      `https://${azureDevOpsOptions.server}`,
      [authHandler],
    );

    return new AzureDevOpsApi(restClient, options.logger);
  }

  public async getServiceConnections(
    organization: string,
    project: string,
    serviceConnectionNames: string,
    apiVersion = '7.2-preview.4',
  ): Promise<ServiceEndpointResponse> {
    const encodedOrganization = encodeURIComponent(organization);
    const encodedProject = encodeURIComponent(project);
    const resource = `/${encodedOrganization}/${encodedProject}/_apis/serviceendpoint/endpoints?endpointNames=${serviceConnectionNames}&api-version=${apiVersion}`;

    this.logger.info(
      `Calling Azure DevOps REST API. Getting service connection ${serviceConnectionNames} in project ${project}`,
    );

    const serviceConnectionResponse =
      await this.restClient.get<ServiceEndpointResponse>(
        resource,
        this.requestOptions,
      );

    this.handleResponse<ServiceEndpointResponse>(
      resource,
      serviceConnectionResponse,
    );

    return serviceConnectionResponse.result!;
  }

  private handleResponse<T>(resource: string, response: IRestResponse<T>) {
    if (
      !response?.result ||
      response.statusCode < 200 ||
      response.statusCode > 299
    ) {
      const message = response?.statusCode
        ? `Could not get response from resource ${resource}. Status code ${response.statusCode}`
        : `Could not get response from resource ${resource}.`;
      throw new ServiceUnavailableError(message);
    }
  }
}
