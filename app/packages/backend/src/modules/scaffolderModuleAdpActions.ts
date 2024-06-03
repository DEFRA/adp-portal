import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
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
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        fetchApi: fetchApiRef,
      },
      async init({ scaffolder, config, discovery, fetchApi }) {
        const integrations = ScmIntegrations.fromConfig(config);
        const adpClient = new AdpClient({
          discoveryApi: discovery,
          fetchApi: fetchApi,
        });

        scaffolder.addActions(
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
      },
    });
  },
});
