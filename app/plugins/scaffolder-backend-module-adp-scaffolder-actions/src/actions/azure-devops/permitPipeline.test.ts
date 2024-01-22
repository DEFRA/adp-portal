import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { permitPipelineAction } from './permitPipeline';
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

describe('adp:azure:pipeline:permit', () => {
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
        },
      ],
    },
  });

  const integrations = ScmIntegrations.fromConfig(config);
  const action = permitPipelineAction({
    integrations: integrations,
    config: config,
  });

  const mockContext = {
    input: {
      project: 'test-project',
      pipelineId: 1234,
      resources: [
        {
          authorized: true,
          resourceId: '5678',
          resourceType: 'widget',
        },
        {
          authorized: true,
          resourceId: '7890',
          resourceType: 'widget',
        },
      ],
    },
    workspacePath: 'test-workspace',
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };

  const mockClientImpl = {
    update: jest.fn(),
  };
  (RestClient as unknown as jest.Mock).mockImplementation(() => mockClientImpl);

  it('should throw if there is no integration config provided', async () => {
    await expect(
      action.handler({
        ...mockContext,
        input: {
          server: 'test.azure.com',
          organization: 'another-test-org',
          project: 'test-project',
          pipelineId: 1234,
          resources: [
            {
              authorized: true,
              resourceId: '5678',
              resourceType: 'widget',
            },
          ],
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
    'should log a warning if a non-success status code is returned',
    async statusCode => {
      mockClientImpl.update.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      const loggerSpy = jest.spyOn(mockContext.logger, 'warn');

      await action.handler(mockContext);

      expect(loggerSpy).toHaveBeenCalled();
      expect(mockContext.logger.warn).toHaveBeenLastCalledWith(
        expect.stringContaining('Could not set pipeline permissions'),
      );
    },
  );

  it('should call the Azure API with the correct values', async () => {
    mockClientImpl.update.mockImplementation(() => ({
      statusCode: 200,
      result: {},
    }));

    await action.handler(mockContext);

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockClientImpl.update).toHaveBeenCalledWith(
      expect.stringContaining(mockContext.input.project),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('should log an info message if the pipeline resources have been permitted', async () => {
    mockClientImpl.update.mockImplementation(() => ({
      statusCode: 200,
      result: {},
    }));

    const loggerSpy = jest.spyOn(mockContext.logger, 'info');

    await action.handler(mockContext);

    expect(loggerSpy).toHaveBeenCalled();
    expect(mockContext.logger.info).toHaveBeenLastCalledWith(
      'Successfully changed pipeline permissions',
    );
  });
});
