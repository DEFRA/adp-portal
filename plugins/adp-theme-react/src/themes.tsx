import React from 'react';
import { UnifiedThemeProvider } from '@backstage/theme';
import LightIcon from '@material-ui/icons/WbSunnyRounded';
import NightIcon from '@material-ui/icons/Brightness2Rounded';
import type { AppOptions } from '@backstage/core-app-api';
import { darkTheme, lightTheme } from './themeConfigs';

export const themes = [
  {
    id: 'default-light',
    title: 'Default Light',
    variant: 'light',
    icon: <LightIcon />,
    Provider: ({ children }) => (
      <UnifiedThemeProvider theme={lightTheme}>{children}</UnifiedThemeProvider>
    ),
  },
  {
    id: 'default-dark',
    title: 'Default Dark',
    variant: 'dark',
    icon: <NightIcon />,
    Provider: ({ children }) => (
      <UnifiedThemeProvider theme={darkTheme}>{children}</UnifiedThemeProvider>
    ),
  },
] satisfies AppOptions['themes'];
