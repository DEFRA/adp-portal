import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { getServiceConnectionAction } from './getServiceConnection';
import { getVoidLogger } from '@backstage/backend-common';
import { PassThrough } from 'stream';
import { RestClient } from 'typed-rest-client';

jest.mock('azure-devops-node-api', () => ({
  getHandlerFromToken: jest.fn().mockReturnValue(() => {}),
  getPersonalAccessTokenHandler: jest.fn().mockReturnValue(() => {}),
}));

jest.mock('typed-rest-client', () => ({
  RestClient: jest.fn(),
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

  const mockGetter = {
    get: jest.fn(),
  };
  (RestClient as unknown as jest.Mock).mockImplementation(() => mockGetter);

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

  it('should throw if no response is returned', async () => {
    await expect(action.handler(mockContext)).rejects.toThrow(
      /Could not get response from resource/,
    );
  });

  it.each([101, 301, 418, 500])(
    'should throw if a non-success status code is returned',
    async statusCode => {
      mockGetter.get.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      await expect(action.handler(mockContext)).rejects.toThrow(
        /Could not get response from resource/,
      );
    },
  );

  it('should throw if no service connection ID is returned', async () => {
    mockGetter.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        count: 0,
        value: [],
      },
    }));

    await expect(action.handler(mockContext)).rejects.toThrow(
      /Unable to find service connection/,
    );
  });

  it('should call the Azure API with the correct values', async () => {
    mockGetter.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        count: 1,
        value: [
          {
            id: '12345',
            url: 'https://service.connection',
          },
        ],
      },
    }));

    await action.handler(mockContext);

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockGetter.get).toHaveBeenCalledWith(
      expect.stringContaining(mockContext.input.project),
      expect.any(Object),
    );
    expect(mockGetter.get).toHaveBeenCalledWith(
      expect.stringContaining(mockContext.input.serviceConnectionName),
      expect.any(Object),
    );
  });

  it('should store the service connection ID in the action context output', async () => {
    mockGetter.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        count: 1,
        value: [
          {
            id: '12345',
            url: 'https://service.connection',
          },
        ],
      },
    }));

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith(
      'serviceConnectionId',
      '12345',
    );
  });
});
