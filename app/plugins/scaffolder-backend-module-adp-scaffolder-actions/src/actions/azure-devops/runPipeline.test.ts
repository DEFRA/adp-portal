import { ConfigReader } from "@backstage/config";
import { ScmIntegrations } from "@backstage/integration";
import { runPipelineAction } from "./runPipeline";
import { getVoidLogger } from "@backstage/backend-common";
import { PassThrough } from 'stream';
import { RestClient } from "typed-rest-client";

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
            href: 'http://dev.azure.com/link/to/pipeline'
          }
        },
        url: 'http://dev.azure.com/link/to/pipeline',
        id: 1234,
        name: 'pipeline-name',
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
});
