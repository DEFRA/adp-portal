import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { getServiceConnectionAction } from './getServiceConnection';
import { getVoidLogger } from '@backstage/backend-common';
import { PassThrough } from 'stream';
import { WebApi } from 'azure-devops-node-api';

jest.mock('azure-devops-node-api', () => ({
  WebApi: jest.fn(),
  getBasicHandler: jest.fn().mockReturnValue(() => {}),
  getBearerHandler: jest.fn().mockReturnValue(() => {}),
  getHandlerFromToken: jest.fn().mockReturnValue(() => {}),
  getPersonalAccessTokenHandler: jest.fn().mockReturnValue(() => {}),
}));

describe('adp:azure:serviceconnection:get', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const config = new ConfigReader({
    azureDevOps: {
      host: 'dev.azure.com',
      token: 'token',
      organization: 'org',
    },
    integrations: {
      azure: [
        {
          host: 'dev.azure.com',
          credentials: [{ personalAccessToken: 'faketoken' }],
          // credentials: [
          //   {
          //     clientId: 'client-id',
          //     clientSecret: 'client-secret',
          //     tenantId: 'tenant-id',
          //   },
          // ],
        },
      ],
    },
  });

  const integrations = ScmIntegrations.fromConfig(config);
  const action = getServiceConnectionAction({
    integrations: integrations,
    config: config,
  });

  const mockContext = {
    input: {
      project: 'test-project',
      serviceConnectionName: 'test-service-connection',
    },
    workspacePath: 'test-workspace',
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };

  const mockCoreApi = {
    getConnectedServiceDetails: jest.fn(),
  };
  const mockWebApi = {
    getCoreApi: jest.fn().mockReturnValue(mockCoreApi),
  };
  (WebApi as unknown as jest.Mock).mockImplementation(() => mockWebApi);

  it('should throw if there is no integration config provided', async () => {
    await expect(
      action.handler({
        ...mockContext,
        input: {
          server: 'test.azure.com',
          organization: 'another-test-org',
          project: 'test-project',
          serviceConnectionName: 'test-service-connection',
        },
      }),
    ).rejects.toThrow(/No credentials provided/);
  });

  it('should throw if no service connection is returned', async () => {
    await expect(action.handler(mockContext)).rejects.toThrow(
      /Unable to find service connection/,
    );
  });

  it('should throw if no service connection ID is returned', async () => {
    await expect(action.handler(mockContext)).rejects.toThrow(
      /Unable to find service connection/,
    );
  });

  it('should call the Azure API with the correct values', async () => {
    mockCoreApi.getConnectedServiceDetails.mockImplementation(() => ({
      id: '12345',
      url: 'https://service.connection',
    }));

    await action.handler(mockContext);

    expect(WebApi).toHaveBeenCalledWith(
      'https://dev.azure.com/org',
      expect.any(Function),
    );

    expect(mockCoreApi.getConnectedServiceDetails).toHaveBeenCalledWith(
      mockContext.input.project,
      mockContext.input.serviceConnectionName,
    );
  });

  it('should store the service connection ID in the action context output', async () => {
    mockCoreApi.getConnectedServiceDetails.mockImplementation(() => ({
      id: '12345',
      url: 'https://service.connection',
    }));

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith(
      'serviceConnectionId',
      '12345',
    );
  });
});
