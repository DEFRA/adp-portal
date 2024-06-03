import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { adpAiChatbotPlugin, AdpAiChatbotPage } from '../src/plugin';

createDevApp()
  .registerPlugin(adpAiChatbotPlugin)
  .addPage({
    element: <AdpAiChatbotPage />,
    title: 'Root Page',
    path: '/adp-ai-chatbot'
  })
  .render();
