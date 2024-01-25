import { ConfigReader } from "@backstage/config";
import { ScmIntegrations } from "@backstage/integration";
import { createPipelineAction } from "./createPipeline";
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

describe('adp:azure:pipeline:create', () => {
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
  const action = createPipelineAction({
    integrations: integrations,
    config: config,
  });

  const mockContext = {
    input: {
      project: 'test-project',
      folder: '/test/folder',
      pipelineName: 'test-pipeline',
      repositoryName: 'defra/test-repository',
      yamlPath: './azuredevops/build.yaml',
      serviceConnectionId: '12345'
    },
    workspacePath: 'test-workspace',
    logger: getVoidLogger(),
    logStream: new PassThrough(),
    output: jest.fn(),
    createTemporaryDirectory: jest.fn(),
  };

  const mockCreator = {
    create: jest.fn(),
  };
  (RestClient as unknown as jest.Mock).mockImplementation(() => mockCreator);

  it('should throw if there is no integration config provided', async () => {
    await expect(
      action.handler({
        ...mockContext,
        input: {
          server: 'test.azure.com',
          organization: 'another-test-org',
          project: 'test-project',
          folder: '/test/folder',
          pipelineName: 'test-pipeline',
          repositoryName: 'defra/test-repository',
          yamlPath: './azuredevops/build.yaml',
          serviceConnectionId: '12345'
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
      mockCreator.create.mockImplementation(() => ({
        statusCode: statusCode,
      }));

      await expect(action.handler(mockContext)).rejects.toThrow(
        /Could not get response from resource/,
      );
    },
  );

  it('should throw if a pipeline is not created', async () => {
    mockCreator.create.mockImplementation(() => ({
      statusCode: 200,
      result: null,
    }));

    await expect(action.handler(mockContext)).rejects.toThrow(
      /Unable to create new pipeline/,
    );
  });

  it('should call the Azure API with the correct values', async () => {
    mockCreator.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/pipeline'
          }
        },
        url: 'http://dev.azure.com/link/to/pipeline',
        id: 1234,
        revision: '1',
        name: 'pipeline-name',
        folder: 'folder\\path'
      },
    }));

    await action.handler(mockContext);

    expect(RestClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('dev.azure.com'),
      expect.any(Array),
    );

    expect(mockCreator.create).toHaveBeenCalledWith(
      expect.stringContaining(mockContext.input.project),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('should store the pipeline ID in the action context output', async () => {
    mockCreator.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/pipeline'
          }
        },
        url: 'http://dev.azure.com/link/to/pipeline',
        id: 1234,
        revision: '1',
        name: 'pipeline-name',
        folder: 'folder\\path'
      },
    }));

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith(
      'pipelineId',
      1234,
    );
  });

  it('should store the pipeline URL in the action context output', async () => {
    mockCreator.create.mockImplementation(() => ({
      statusCode: 200,
      result: {
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/pipeline'
          }
        },
        url: 'http://dev.azure.com/link/to/pipeline',
        id: 1234,
        revision: '1',
        name: 'pipeline-name',
        folder: 'folder\\path'
      },
    }));

    await action.handler(mockContext);

    expect(mockContext.output).toHaveBeenCalledWith(
      'pipelineUrl',
      'http://dev.azure.com/link/to/pipeline',
    );
  });
});
