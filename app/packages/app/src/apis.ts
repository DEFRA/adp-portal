import {
  ScmIntegrationsApi,
  scmIntegrationsApiRef,
  ScmAuth,
} from '@backstage/integration-react';
import type { AnyApiFactory } from '@backstage/core-plugin-api';
import {
  configApiRef,
  createApiFactory,
  fetchApiRef,
} from '@backstage/core-plugin-api';
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
    deps: { configApi: configApiRef, fetchApi: fetchApiRef },
    factory: ({ configApi, fetchApi }) =>
      new AdpDataTechRadarApi(configApi, fetchApi),
  }),
  ScmAuth.createDefaultApiFactory(),
];
