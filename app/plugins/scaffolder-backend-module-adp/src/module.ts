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
import * as actions from './actions';
import * as filters from './filters';
import { createGithubClient } from './util';
import {
  type RequestContextMiddleware,
  requestContextMiddlewareRef,
} from '@internal/plugin-request-context-provider-backend';
import { type TemplateAction } from '@backstage/plugin-scaffolder-node';
import express, { type Request as ExpressRequest } from 'express';
import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';

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
        requestContextMiddleware: requestContextMiddlewareRef,
      },
      async init({
        scaffolderActions,
        scaffolderTemplating,
        config,
        discovery,
        fetchApi,
        requestContextMiddleware,
      }) {
        const integrations = ScmIntegrations.fromConfig(config);

        scaffolderActions.addActions(
          ...withMiddleware({
            middleware: [useRequestContextMiddleware(requestContextMiddleware)],
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
                adpClient: new AdpClient({
                  discoveryApi: discovery,
                  fetchApi: fetchApi,
                }),
              }),
              actions.publishZipAction,
            ],
          }),
        );

        scaffolderTemplating.addTemplateFilters({ ...filters });
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
  middleware: (
    handler: TemplateAction<any, any>['handler'],
    templateAction: TemplateAction<any, any>,
  ) => typeof handler,
) {
  return (templateAction: TemplateAction<any, any>) => {
    // We want to replace the handler method without modifying the original action,
    // so we create a new object with the current action as its prototype. That way
    // we can modify the new object without affecting the original, while still
    // inheriting all its properties.
    const result: typeof templateAction = Object.create(templateAction);
    result.handler = middleware(result.handler.bind(result), result);
    return result;
  };
}

function useRequestContextMiddleware(middleware: RequestContextMiddleware) {
  return createHandlerMiddleware((handler, { id }) => {
    return async ctx => {
      const socket = new Socket();
      try {
        // Create a dummy express request object to use as the context.
        const request: ExpressRequest = Object.setPrototypeOf(
          new IncomingMessage(socket),
          express.request,
        );
        request.method = 'POST';
        request.url = `/scaffolder/actions/${id}`;
        request.body = ctx.input;
        const credentials = await ctx.getInitiatorCredentials();
        if ('token' in credentials && typeof credentials.token)
          request.headers.authorization = `Bearer ${credentials.token}`;
        return await middleware.run(request, () => handler(ctx));
      } finally {
        socket.destroy();
      }
    };
  });
}
