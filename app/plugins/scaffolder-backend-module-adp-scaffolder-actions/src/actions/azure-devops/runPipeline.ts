import { Config } from '@backstage/config';
import { ScmIntegrationRegistry } from '@backstage/integration';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';

type RunPipelineOptions = {
  pipelineApiVersion?: string;
  buildApiVersion?: string;
  server?: string;
  organization?: string;
  project: string;
  pipelineId: number;
  branch?: string;
  pipelineParameters?: string;
};

export function runPipelineAction(options: {
  integrations: ScmIntegrationRegistry;
  config: Config;
}) {
  return createTemplateAction<RunPipelineOptions>({
    id: 'adp:azure:pipeline:run',
    description: 'Runs an Azure DevOps pipeline',
    schema: {
      input: {
        required: ['project', 'pipelineId'],
        type: 'object',
        properties: {
          runApiVersion: {
            type: 'string',
            title: 'Run API Version',
            description:
              'The Pipeline API version to use. Defaults to 7.2-preview.1',
          },
          buildApiVersion: {
            type: 'string',
            title: 'Build API Version',
            description:
              'The Build API version to use. Defaults to 7.2-preview.7',
          },
          server: {
            type: 'string',
            title: 'Server',
            description:
              'The hostname of the Azure DevOps service. Defaults to the azureDevOps.host config setting',
          },
          organization: {
            type: 'string',
            title: 'Organization',
            description:
              'The name of the Azure DevOps organization. Defaults to the azureDevOps.organization config setting',
          },
          project: {
            type: 'string',
            title: 'Project',
            description:
              'The name of the Azure DevOps project containing the service connection',
          },
          pipelineId: {
            type: 'number',
            title: 'Pipeline ID',
            description: 'The pipeline ID'
          },
          branch: {
            type: 'string',
            title: 'Build Branch',
            description: 'The repository branch to build. Defaults to main',
          },
          pipelineParameters: {
            type: 'object',
            title: 'Pipeline Parameters',
            description: 'Parameters passed in to the pipeline run',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          buildRunUrl: {
            type: 'string',
            title: 'Build Run URL',
            description: 'The URL to the build run',
          },
        },
      },
    },

    async handler(ctx) {},
  });
}
