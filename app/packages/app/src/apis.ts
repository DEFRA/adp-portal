import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import type { AnyApiFactory } from '@backstage/core-plugin-api';
import { configApiRef, createApiFactory } from '@backstage/core-plugin-api';
import { AdpDataTechRadarApi } from './lib/techradar/techradardata';
import { techRadarApiRef } from '@backstage/plugin-tech-radar';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: scmIntegrationsApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
  }),
  createApiFactory({
    api: techRadarApiRef,
    deps: { configApi: configApiRef },
    factory: ({ configApi }) => new AdpDataTechRadarApi(configApi),
  }),
  ScmAuth.createDefaultApiFactory(),
];
