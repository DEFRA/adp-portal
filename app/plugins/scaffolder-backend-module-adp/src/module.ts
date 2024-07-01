import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { ScmIntegrations } from '@backstage/integration';
import {
  scaffolderActionsExtensionPoint,
  scaffolderTemplatingExtensionPoint,
} from '@backstage/plugin-scaffolder-node/alpha';
import { adpClientRef } from '@internal/plugin-adp-backend';
import * as actions from './actions';
import * as filters from './filters';
import { createGithubClient } from './util';
import { type TemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  credentialsContextServiceRef,
  tokenProviderRef,
  type ICredentialsContextService,
} from '@internal/plugin-credentials-context-backend';
import { fetchApiRef } from '@internal/plugin-fetch-api-backend';
import * as backendActions from './actions/backend';

const { createGithubRepoUrlFilter, ...allFilters } = filters;

export const adpScaffolderModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'adp',
  register(env) {
    env.registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        scaffolderTemplating: scaffolderTemplatingExtensionPoint,
        config: coreServices.rootConfig,
        credentialsContext: credentialsContextServiceRef,
        adpClient: adpClientRef,
        fetchApi: fetchApiRef,
        tokens: tokenProviderRef,
      },
      async init({
        scaffolderActions,
        scaffolderTemplating,
        config,
        credentialsContext,
        adpClient,
        fetchApi,
        tokens,
      }) {
        const integrations = ScmIntegrations.fromConfig(config);

        scaffolderActions.addActions(
          ...withMiddleware({
            middleware: [useCredentialsContextMiddleware(credentialsContext)],
            templateActions: [
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
                  createGithubClient(integrations, config, org),
                adpClient,
              }),
              actions.publishZipAction,
              ...Object.values(backendActions).map(factory =>
                factory({
                  config,
                  fetchApi,
                  tokens,
                }),
              ),
            ],
          }),
        );

        scaffolderTemplating.addTemplateFilters({
          ...allFilters,
          githubRepoUrl: createGithubRepoUrlFilter(config),
        });
      },
    });
  },
});

function withMiddleware(options: {
  middleware: Array<
    (templateAction: TemplateAction<any, any>) => TemplateAction<any, any>
  >;
  templateActions: TemplateAction<any, any>[];
}) {
  return options.templateActions.map(templateAction =>
    options.middleware.reduceRight(
      (next, middleware) => middleware(next),
      templateAction,
    ),
  );
}

function createHandlerMiddleware(
  middleware: (handler: TemplateAction<any, any>['handler']) => typeof handler,
) {
  return (templateAction: TemplateAction<any, any>) => {
    // We want to replace the handler method without modifying the original action,
    // so we create a new object with the current action as its prototype. That way
    // we can modify the new object without affecting the original, while still
    // inheriting all its properties.
    const result: typeof templateAction = Object.create(templateAction);
    result.handler = middleware(result.handler.bind(result));
    return result;
  };
}

function useCredentialsContextMiddleware(
  middleware: ICredentialsContextService,
) {
  return createHandlerMiddleware(handler => {
    return async ctx => {
      const credentials = await ctx.getInitiatorCredentials();
      return await middleware.run(credentials, () => handler(ctx));
    };
  });
}
