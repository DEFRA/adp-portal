import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { runPipelineAction } from './runPipeline';
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

describe('adp:azure:pipeline:run', () => {
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
  const action = runPipelineAction({
    integrations: integrations,
    config: config,
  });

  const mockContext = {
    input: {
      project: 'test-project',
      pipelineId: 1234,
    },
    workspacePath: 'test-workspace',
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };

  const mockClientImpl = {
    get: jest.fn(),
    create: jest.fn(),
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
    'should throw if a non-success status code is returned when creating the pipeline run',
    async statusCode => {
      mockClientImpl.create.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      await expect(action.handler(mockContext)).rejects.toThrow(
        /Could not get response from resource/,
      );
    },
  );

  it('should throw if a pipeline run is not created', async () => {
    mockClientImpl.create.mockImplementation(() => ({
      statusCode: 200,
      result: null,
    }));

    await expect(action.handler(mockContext)).rejects.toThrow(
      /Unable to run pipeline/,
    );
  });

  it('should call the Azure Pipeline API with the correct values', async () => {
    mockClientImpl.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
      },
    }));
    mockClientImpl.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        id: 1234,
        buildNumber: '0.1.1-1234-0',
        reason: 'manual',
        status: 'completed',
        url: 'http://dev.azure.com/link/to/build',
      },
    }));

    await action.handler(mockContext);

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockClientImpl.create).toHaveBeenCalledWith(
      expect.stringContaining(mockContext.input.project),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('should store the build ID in the action context output', async () => {
    mockClientImpl.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
      },
    }));
    mockClientImpl.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        id: 1234,
        buildNumber: '0.1.1-1234-0',
        reason: 'manual',
        status: 'completed',
        url: 'http://dev.azure.com/link/to/build',
      },
    }));

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith('buildId', 1234);
  });

  it('should store the pipeline run URL in the action context output', async () => {
    mockClientImpl.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
      },
    }));
    mockClientImpl.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        id: 1234,
        buildNumber: '0.1.1-1234-0',
        reason: 'manual',
        status: 'completed',
        url: 'http://dev.azure.com/link/to/build',
      },
    }));

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith(
      'pipelineRunUrl',
      'http://dev.azure.com/link/to/build',
    );
  });

  it('should call the Azure Build API with the correct values', async () => {
    mockClientImpl.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
      },
    }));
    mockClientImpl.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        id: 1234,
        buildNumber: '0.1.1-1234-0',
        reason: 'manual',
        status: 'completed',
        url: 'http://dev.azure.com/link/to/build',
      },
    }));

    await action.handler(mockContext);

    expect(mockClientImpl.get).toHaveBeenCalledWith(
      expect.stringContaining(mockContext.input.project),
      expect.any(Object),
    );
    expect(mockClientImpl.get).toHaveBeenCalledWith(
      expect.stringContaining('1234'),
      expect.any(Object),
    );
  });

  it('should log an info message if the build completes successfully', async () => {
    mockClientImpl.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
      },
    }));
    mockClientImpl.get.mockImplementation(() => ({
      statusCode: 200,
      result: {
        id: 1234,
        buildNumber: '0.1.1-1234-0',
        reason: 'manual',
        status: 'completed',
        url: 'http://dev.azure.com/link/to/build',
      },
    }));

    const loggerSpy = jest.spyOn(mockContext.logger, 'info');

    await action.handler(mockContext);

    expect(loggerSpy).toHaveBeenCalled();
    expect(mockContext.logger.info).toHaveBeenLastCalledWith(
      'Pipeline run successfully completed',
    );
  });

  it.each([101, 301, 418, 500])(
    'should throw if a non-success status code is returned when getting the pipeline status',
    async statusCode => {
      mockClientImpl.create.mockImplementation(() => ({
        statusCode: 200,
        result: {
          _links: {
            web: {
              href: 'http://dev.azure.com/link/to/build',
            },
          },
          url: 'http://dev.azure.com/link/to/build',
          id: 1234,
          name: 'pipeline-name',
        },
      }));
      mockClientImpl.get.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      await expect(action.handler(mockContext)).rejects.toThrow(
        /Could not get response from resource/,
      );
    },
  );
});
