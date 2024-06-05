import {
  scaffolderActionsExtensionPoint,
  scaffolderTemplatingExtensionPoint,
} from '@backstage/plugin-scaffolder-node/alpha';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';
import {
  addDeliveryProjectToRepo,
  addGithubTeamToRepoAction,
  createGithubClient,
  createGithubTeamAction,
  createPipelineAction,
  filters,
  getServiceConnectionAction,
  permitPipelineAction,
  runPipelineAction,
} from '@internal/backstage-plugin-scaffolder-backend-module-adp-scaffolder-actions';
import { AdpClient } from '@internal/plugin-adp-backend';
import { fetchApiRef } from '@internal/plugin-fetch-api-backend';

export const addScaffolderModuleAdpActions = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'adp-actions',
  register(env) {
    env.registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        scaffolderTemplating: scaffolderTemplatingExtensionPoint,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        fetchApi: fetchApiRef,
      },
      async init({
        scaffolderActions,
        scaffolderTemplating,
        config,
        discovery,
        fetchApi,
      }) {
        const integrations = ScmIntegrations.fromConfig(config);
        const adpClient = new AdpClient({
          discoveryApi: discovery,
          fetchApi: fetchApi,
        });

        scaffolderActions.addActions(
          createPipelineAction({
            integrations: integrations,
            config: config,
          }),
          getServiceConnectionAction({
            integrations: integrations,
            config: config,
          }),
          permitPipelineAction({
            integrations: integrations,
            config: config,
          }),
          runPipelineAction({
            integrations: integrations,
            config: config,
          }),
          createGithubTeamAction({
            integrations: integrations,
            config: config,
          }),
          addGithubTeamToRepoAction({
            integrations: integrations,
            config: config,
          }),
          addDeliveryProjectToRepo({
            config: config,
            getGithubClient: org =>
              createGithubClient(integrations, config, org),
            adpClient,
          }),
        );

        scaffolderTemplating.addTemplateFilters({ ...filters });
      },
    });
  },
});
