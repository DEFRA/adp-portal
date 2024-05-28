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

import type { IconComponent } from '@backstage/core-plugin-api';
import { microsoftAuthApiRef } from '@backstage/core-plugin-api';

import LinearScaleIcon from '@material-ui/icons/LinearScale';
import PolicyIcon from '@material-ui/icons/Policy';
import WebIcon from '@material-ui/icons/Web';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CloudIcon from '@material-ui/icons/Cloud';

import { FluxRuntimePage } from '@weaveworksoss/backstage-plugin-flux';
import { themes } from '@internal/plugin-adp-theme-react';

import {
  AdpPage,
  AlbViewPageComponent,
  DeliveryProgrammeViewPageComponent,
  DeliveryProjectViewPageComponent,
} from '@internal/plugin-adp';

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
  themes,
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
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage()}
    </Route>
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
    <Route path="/onboarding" element={<AdpPage />} />
    <Route
      path="/onboarding/arms-length-bodies"
      element={<AlbViewPageComponent />}
    />
    <Route
      path="/onboarding/delivery-programmes"
      element={<DeliveryProgrammeViewPageComponent />}
    />
    <Route
      path="/onboarding/delivery-projects"
      element={<DeliveryProjectViewPageComponent />}
    />
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
