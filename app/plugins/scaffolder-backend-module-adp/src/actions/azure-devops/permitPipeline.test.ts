import { ConfigReader } from '@backstage/config';
import { ScmIntegrations } from '@backstage/integration';
import {
  type PermitPipelineActionInput,
  permitPipelineAction,
} from './permitPipeline';
import { AzureDevOpsApi } from './AzureDevOpsApi';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

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

  it('should throw if no response is returned from the API', async () => {
    const context = createMockActionContext<PermitPipelineActionInput>({
      input: {
        project: 'test-project',
        pipelineId: 1234,
        resources: {
          serviceConnectionIds: [
            '7d1286fb-33e7-43ee-b5db-68edd53ac7e1',
            '83e3836d-eb1e-4a9c-8bd2-b5a473581a2d',
            'a24305f9-dbd5-4043-8953-1df24e369c62',
          ],
          variableGroupIds: [111, 222, 333],
          environmentIds: [444, 555, 666],
          agentQueueIds: [777, 888, 999],
        },
      },
      workspacePath: 'test-workspace',
    });
    const permitSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'permitPipeline')
      .mockResolvedValue(undefined!);

    expect(permitSpy).not.toHaveBeenCalled();
    await expect(action.handler(context)).rejects.toThrow(
      /Unable to permit pipeline resources/,
    );
  });

  it('should log an info message if the pipeline resources have been permitted', async () => {
    const context = createMockActionContext<PermitPipelineActionInput>({
      input: {
        project: 'test-project',
        pipelineId: 1234,
        resources: {
          serviceConnectionIds: [
            '7d1286fb-33e7-43ee-b5db-68edd53ac7e1',
            '83e3836d-eb1e-4a9c-8bd2-b5a473581a2d',
            'a24305f9-dbd5-4043-8953-1df24e369c62',
          ],
          variableGroupIds: [111, 222, 333],
          environmentIds: [444, 555, 666],
          agentQueueIds: [777, 888, 999],
        },
      },
      workspacePath: 'test-workspace',
    });
    const permitSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'permitPipeline')
      .mockResolvedValue([
        {
          resource: {
            id: '1234',
            name: 'service-connection',
            type: 'endpoint',
          },
          allPipelines: {
            authorized: true,
            authorizedBy: { name: 'test-user' },
            authorizedOn: '2024-01-25',
          },
          pipelines: [
            {
              authorized: true,
              authorizedBy: { name: 'test-user' },
              authorizedOn: '2024-01-25',
              id: 5678,
            },
          ],
        },
      ]);

    const loggerSpy = jest.spyOn(context.logger, 'info');

    await action.handler(context);

    expect(permitSpy).toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalled();
    expect(context.logger.info).toHaveBeenLastCalledWith(
      'Updated resource permissions in pipeline 1234',
    );
  });

  it.each([
    {
      variableGroupIds: [111, 222, 333],
      environmentIds: [444, 555, 666],
      agentQueueIds: [777, 888, 999],
    },
    {
      serviceConnectionIds: [
        '7d1286fb-33e7-43ee-b5db-68edd53ac7e1',
        '83e3836d-eb1e-4a9c-8bd2-b5a473581a2d',
        'a24305f9-dbd5-4043-8953-1df24e369c62',
      ],
      environmentIds: [444, 555, 666],
      agentQueueIds: [777, 888, 999],
    },
    {
      serviceConnectionIds: [
        '7d1286fb-33e7-43ee-b5db-68edd53ac7e1',
        '83e3836d-eb1e-4a9c-8bd2-b5a473581a2d',
        'a24305f9-dbd5-4043-8953-1df24e369c62',
      ],
      variableGroupIds: [111, 222, 333],
      agentQueueIds: [777, 888, 999],
    },
    {
      serviceConnectionIds: [
        '7d1286fb-33e7-43ee-b5db-68edd53ac7e1',
        '83e3836d-eb1e-4a9c-8bd2-b5a473581a2d',
        'a24305f9-dbd5-4043-8953-1df24e369c62',
      ],
      variableGroupIds: [111, 222, 333],
      environmentIds: [444, 555, 666],
    },
  ])('should handle missing resource types', async resources => {
    const context = createMockActionContext<PermitPipelineActionInput>({
      input: {
        project: 'test-project',
        pipelineId: 1234,
        resources,
      },
      workspacePath: 'test-workspace',
    });
    const permitSpy = jest
      .spyOn(AzureDevOpsApi.prototype, 'permitPipeline')
      .mockResolvedValue([
        {
          resource: {
            id: '1234',
            name: 'some-resource',
            type: 'some-resource-type',
          },
          allPipelines: {
            authorized: true,
            authorizedBy: { name: 'test-user' },
            authorizedOn: '2024-01-25',
          },
          pipelines: [
            {
              authorized: true,
              authorizedBy: { name: 'test-user' },
              authorizedOn: '2024-01-25',
              id: 1111,
            },
          ],
        },
      ]);

    const loggerSpy = jest.spyOn(context.logger, 'info');

    await action.handler(context);

    expect(permitSpy).toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenCalled();
  });
});
