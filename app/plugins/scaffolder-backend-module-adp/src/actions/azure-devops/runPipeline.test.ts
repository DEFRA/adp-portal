import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import { type RunPipelineActionInput, runPipelineAction } from './runPipeline';
import { AzureDevOpsApi } from './AzureDevOpsApi';
import { BuildResult, BuildStatus } from './types';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

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

  it('should throw if no response is returned from the API', async () => {
    const context = createMockActionContext<RunPipelineActionInput>({
      input: {
        project: 'test-project',
        pipelineId: 1234,
      },
      workspacePath: 'test-workspace',
    });
    const runSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'runPipeline')
      .mockResolvedValue(undefined!);

    expect(runSpy).not.toHaveBeenCalled();
    await expect(action.handler(context)).rejects.toThrow(
      /Unable to run pipeline/,
    );
  });

  it('should store the build ID in the action context output', async () => {
    const context = createMockActionContext<RunPipelineActionInput>({
      input: {
        project: 'test-project',
        pipelineId: 1234,
      },
      workspacePath: 'test-workspace',
    });
    const runSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'runPipeline')
      .mockResolvedValue({
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
        templateParameters: {},
        pipeline: {
          url: 'http://dev.azure.com/link/to/build',
          id: 5678,
          name: 'pipeline',
          revision: 1,
          folder: '/path/to/pipeline',
        },
        state: 'inProgress',
        createdDate: new Date('2024-01-26T12:06:00.1728415Z'),
        resources: {},
      });

    const getSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'getBuild')
      .mockResolvedValue({
        id: 1234,
        buildNumber: '1234.1',
        url: 'http://dev.azure.com/link/to/pipeline/run',
        reason: 'manual',
        status: BuildStatus.InProgress,
        result: BuildResult.None,
      });

    await action.handler(context);

    expect(runSpy).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
    expect(context.output).toHaveBeenCalledWith('buildId', 1234);
  });

  it('should store the pipeline run URL in the action context output', async () => {
    const context = createMockActionContext<RunPipelineActionInput>({
      input: {
        project: 'test-project',
        pipelineId: 1234,
      },
      workspacePath: 'test-workspace',
    });
    const runSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'runPipeline')
      .mockResolvedValue({
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
        templateParameters: {},
        pipeline: {
          url: 'http://dev.azure.com/link/to/build',
          id: 5678,
          name: 'pipeline',
          revision: 1,
          folder: '/path/to/pipeline',
        },
        state: 'inProgress',
        createdDate: new Date('2024-01-26T12:06:00.1728415Z'),
        resources: {},
      });

    const getSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'getBuild')
      .mockResolvedValue({
        id: 1234,
        buildNumber: '1234.1',
        url: 'http://dev.azure.com/link/to/pipeline/run',
        reason: 'manual',
        status: BuildStatus.InProgress,
        result: BuildResult.None,
      });

    await action.handler(context);

    expect(runSpy).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
    expect(context.output).toHaveBeenCalledWith(
      'pipelineRunUrl',
      'http://dev.azure.com/link/to/build',
    );
  });

  it('should log an info message if the build completes successfully', async () => {
    const context = createMockActionContext<RunPipelineActionInput>({
      input: {
        project: 'test-project',
        pipelineId: 1234,
      },
      workspacePath: 'test-workspace',
    });
    const runSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'runPipeline')
      .mockResolvedValue({
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
        templateParameters: {},
        pipeline: {
          url: 'http://dev.azure.com/link/to/build',
          id: 5678,
          name: 'pipeline',
          revision: 1,
          folder: '/path/to/pipeline',
        },
        state: 'inProgress',
        createdDate: new Date('2024-01-26T12:06:00.1728415Z'),
        resources: {},
      });

    const getSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'getBuild')
      .mockResolvedValue({
        id: 1234,
        buildNumber: '1234.1',
        url: 'http://dev.azure.com/link/to/pipeline/run',
        reason: 'manual',
        status: BuildStatus.InProgress,
        result: BuildResult.None,
      });

    const loggerSpy = jest.spyOn(context.logger, 'info');

    await action.handler(context);

    expect(runSpy).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalled();
    expect(context.logger.info).toHaveBeenLastCalledWith(
      'Pipeline run started',
    );
  });

  it('should log a warning message if there is an issue with the build', async () => {
    const context = createMockActionContext<RunPipelineActionInput>({
      input: {
        project: 'test-project',
        pipelineId: 1234,
      },
      workspacePath: 'test-workspace',
    });
    const runSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'runPipeline')
      .mockResolvedValue({
        _links: {
          web: {
            href: 'http://dev.azure.com/link/to/build',
          },
        },
        url: 'http://dev.azure.com/link/to/build',
        id: 1234,
        name: 'pipeline-name',
        templateParameters: {},
        pipeline: {
          url: 'http://dev.azure.com/link/to/build',
          id: 5678,
          name: 'pipeline',
          revision: 1,
          folder: '/path/to/pipeline',
        },
        state: 'inProgress',
        createdDate: new Date('2024-01-26T12:06:00.1728415Z'),
        resources: {},
      });

    const getSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'getBuild')
      .mockResolvedValue({
        id: 1234,
        buildNumber: '1234.1',
        url: 'http://dev.azure.com/link/to/pipeline/run',
        reason: 'manual',
        status: BuildStatus.Failed,
        result: BuildResult.None,
      });

    const loggerSpy = jest.spyOn(context.logger, 'warn');

    await action.handler(context);

    expect(runSpy).toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalled();
    expect(context.logger.warn).toHaveBeenLastCalledWith(
      expect.stringContaining('Pipeline run could not start'),
    );
  });
});
