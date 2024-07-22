import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { adpPlugin, AdpPage } from '../src/plugin';

createDevApp()
  .registerPlugin(adpPlugin)
  .addPage({
    element: <AdpPage />,
    title: 'Root Page',
    path: '/adp',
  })
  .render();
