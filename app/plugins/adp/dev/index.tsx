import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { adpPlugin, AdpPage, AlbViewPage } from '../src/plugin';

createDevApp()
  .registerPlugin(adpPlugin)
  .addPage({
    element: <AdpPage />,
    title: 'Root Page',
    path: '/adp'
  }).addPage({
    element: <AlbViewPage />,
    title: 'ALB View Page',
    path: '/alb'
  })
  .render();
