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
  filters,
  actions,
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
          actions.createPipelineAction({
            integrations: integrations,
            config: config,
          }),
          actions.getServiceConnectionAction({
            integrations: integrations,
            config: config,
          }),
          actions.permitPipelineAction({
            integrations: integrations,
            config: config,
          }),
          actions.runPipelineAction({
            integrations: integrations,
            config: config,
          }),
          actions.createGithubTeamAction({
            integrations: integrations,
            config: config,
          }),
          actions.addGithubTeamToRepoAction({
            integrations: integrations,
            config: config,
          }),
          actions.addDeliveryProjectToRepo({
            config: config,
            getGithubClient: org =>
              actions.createGithubClient(integrations, config, org),
            adpClient,
          }),
          actions.publishZipAction,
        );

        scaffolderTemplating.addTemplateFilters({ ...filters });
      },
    });
  },
});
