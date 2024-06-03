import { createPlugin, createRoutableExtension } from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const adpAiChatbotPlugin = createPlugin({
  id: 'adp-ai-chatbot',
  routes: {
    root: rootRouteRef,
  },
});

export const AdpAiChatbotPage = adpAiChatbotPlugin.provide(
  createRoutableExtension({
    name: 'AdpAiChatbotPage',
    component: () =>
      import('./components/Chatbot').then(m => m.Chatbot),
    mountPoint: rootRouteRef,
  }),
);
