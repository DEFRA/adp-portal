import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';
import {
  scaffolderActionsExtensionPoint,
  scaffolderTemplatingExtensionPoint,
} from '@backstage/plugin-scaffolder-node/alpha';
import { fetchApiRef } from '@internal/plugin-fetch-api-backend';
import { AdpClient } from '@internal/plugin-adp-backend';
import {
  addDeliveryProjectToRepo,
  addGithubTeamToRepoAction,
  createGithubClient,
  createGithubTeamAction,
  createPipelineAction,
  getServiceConnectionAction,
  permitPipelineAction,
  runPipelineAction,
} from './actions';
import { filters } from '.';

export const adpScaffolderModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'adp',
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
          createPipelineAction({ integrations, config }),
          getServiceConnectionAction({ integrations, config }),
          permitPipelineAction({ integrations, config }),
          runPipelineAction({ integrations, config }),
          createGithubTeamAction({ integrations, config }),
          addGithubTeamToRepoAction({ integrations, config }),
          addDeliveryProjectToRepo({
            config,
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
