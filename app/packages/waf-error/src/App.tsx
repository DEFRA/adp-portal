import React from 'react';

import {
  ApiProvider,
  AppThemeSelector,
  ConfigReader,
} from '@backstage/core-app-api';
import { appThemeApiRef, configApiRef } from '@backstage/core-plugin-api';
import { BasicApiRegistry } from './BasicApiRegistry';
import { ErrorPage } from './ErrorPage';
import { useAppTheme } from './useAppTheme';
import { themes } from '@internal/plugin-adp-theme-react';
import { StylesProvider } from '@material-ui/core';

const apis = new BasicApiRegistry([
  [configApiRef, new ConfigReader({})],
  [appThemeApiRef, AppThemeSelector.createWithStorage(themes)],
]);

const ThemeProvider: React.FC = ({ children }) => {
  const currentTheme = useAppTheme();
  return <currentTheme.Provider>{children}</currentTheme.Provider>;
};

const App = () => {
  return (
    <ApiProvider apis={apis}>
      <ThemeProvider>
        <StylesProvider
          generateClassName={(rule, styleSheet) =>
            `${styleSheet?.options.classNamePrefix}-${rule.key}`
          }
        >
          <ErrorPage />
        </StylesProvider>
      </ThemeProvider>
    </ApiProvider>
  );
};

export default App;
