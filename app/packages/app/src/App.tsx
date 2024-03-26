import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
} from '@backstage/plugin-catalog';
import { CatalogImportPage } from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import { TechRadarPage } from '@backstage/plugin-tech-radar';
import {
  DefaultTechDocsHome,
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';

import {
  AlertDisplay,
  OAuthRequestDialog,
  SignInPage,
} from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import {
  catalogEntityCreatePermission,
  catalogLocationCreatePermission,
} from '@backstage/plugin-catalog-common/alpha';

import { IconComponent, microsoftAuthApiRef } from '@backstage/core-plugin-api';

import LightIcon from '@material-ui/icons/WbSunnyRounded';
import NightIcon from '@material-ui/icons/Brightness2Rounded';
import LinearScaleIcon from '@material-ui/icons/LinearScale';
import PolicyIcon from '@material-ui/icons/Policy';
import WebIcon from '@material-ui/icons/Web';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CloudIcon from '@material-ui/icons/Cloud';

import {
  UnifiedThemeProvider,
  createUnifiedTheme,
  palettes,
  genPageTheme,
} from '@backstage/theme';

import { FluxRuntimePage } from '@weaveworksoss/backstage-plugin-flux';

import styles from 'style-loader!css-loader?{"modules": {"auto": true}}!sass-loader?{"sassOptions": {"quietDeps": true}}!./style.module.scss';
import { AdpPage } from '@internal/plugin-adp';
import { AlbViewPageComponent } from '@internal/plugin-adp/src/components/ALB/AlbViewPageComponent';
import { DeliveryProgrammeViewPageComponent } from '@internal/plugin-adp/src/components/DeliveryProgramme/DeliveryProgrammeViewPageComponent';


const lightTheme = createUnifiedTheme({
  palette: {
    ...palettes.light,
    navigation: {
      background: styles.lightThemeNav,
      indicator: styles.primaryColour,
      color: styles.unselectedNavText,
      selectedColor: styles.white,
      navItem: {
        hoverBackground: styles.navHoverBackground,
      },
    },
    primary: {
      main: styles.primaryColour,
    },
    link: styles.linkColour,
    linkHover: styles.linkHoverColour,
    errorText: styles.errorColour,
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({ colors: [`${styles.lightThemeNav}`], shape: 'none' }),
  },
  fontFamily: "'GDS Transport',arial, sans-serif",
  components: {
    BackstageHeader: {
      styleOverrides: {
        header: {
          borderBottom: `4px solid ${styles.primaryColour}`,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: styles.secondaryTextColour,
          '&$error': {
            color: styles.secondaryTextColour,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: styles.secondaryTextColour,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        caption: {
          color: ` ${styles.secondaryTextColour} !important`,
        },
      },
    },
  },
});

const darkTheme = createUnifiedTheme({
  palette: {
    ...palettes.dark,
    navigation: {
      background: styles.darkThemeNav,
      indicator: styles.primaryColour,
      color: styles.unselectedNavText,
      selectedColor: styles.white,
      navItem: {
        hoverBackground: styles.navHoverBackground,
      },
    },
    link: styles.linkColour,
    linkHover: styles.linkHoverColour,
    errorText: styles.errorColour,
  },
  defaultPageTheme: 'home',
  pageTheme: {
    home: genPageTheme({ colors: [`${styles.darkThemeNav}`], shape: 'none' }),
  },
  fontFamily: "'GDS Transport',arial, sans-serif",
  components: {
    MuiTypography: {
      styleOverrides: {
        h2: {
          color: `${styles.lightGrey} !important`,
        },
      },
    },
  },
});

const app = createApp({
  components: {
    SignInPage: props => (
      <SignInPage
        {...props}
        auto
        provider={{
          id: 'aad-auth-provider',
          title: 'Azure AD',
          message: 'Sign in using Azure AD',
          apiRef: microsoftAuthApiRef,
        }}
      />
    ),
  },
  apis,
  themes: [
    {
      id: 'default-light',
      title: 'Default Light',
      variant: 'light',
      icon: <LightIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={lightTheme}>
          {children}
        </UnifiedThemeProvider>
      ),
    },
    {
      id: 'default-dark',
      title: 'Default Dark',
      variant: 'dark',
      icon: <NightIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={darkTheme}>
          {children}
        </UnifiedThemeProvider>
      ),
    },
  ],
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {});
    bind(scaffolderPlugin.externalRoutes, {
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
  icons: {
    pipeline: LinearScaleIcon as IconComponent,
    policy: PolicyIcon as IconComponent,
    project: WebIcon as IconComponent,
    check: CheckCircleOutlineIcon as IconComponent,
    cloud: CloudIcon as IconComponent,
  },
});

const routes = (
  <FlatRoutes>
    <Route path="/" element={<Navigate to="catalog" />} />
    <Route path="/catalog" element={<CatalogIndexPage />} />
    <Route path="/alb" element={<AlbViewPageComponent />} />
    <Route path="/deliveryprogramme" element={<DeliveryProgrammeViewPageComponent />} />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    {/* <Route path="/create" element={<ScaffolderPage />} /> */}
    <Route
      path="/create"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <ScaffolderPage
            headerOptions={{
              title: 'Create a new platform service',
              subtitle:
                'Create a new platform service using standard templates in DEFRA',
            }}
          />
        </RequirePermission>
      }
    />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/tech-radar"
      element={
        <TechRadarPage
          width={1500}
          height={800}
          title="Azure Development Platform: Tech Radar"
          subtitle="Supported technologies for DEFRA's Azure Developer Platform"
          pageTitle="ADP Tech Radar"
          id="dev"
        />
      }
    />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogLocationCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/docs" element={<TechDocsIndexPage />}>
      <DefaultTechDocsHome />
    </Route>
    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route path="/flux-runtime" element={<FluxRuntimePage />} />
    <Route path="/adp" element={<AdpPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
