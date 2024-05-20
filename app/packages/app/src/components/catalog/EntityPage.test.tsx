import React from 'react';
import type * as PluginOrg from '@backstage/plugin-org';
import type * as PluginCatalog from '@backstage/plugin-catalog';
import type * as PluginApiDocs from '@backstage/plugin-api-docs';
import type * as PluginGithubPullRequests from '@roadiehq/backstage-plugin-github-pull-requests';
import type * as PluginAzureDevops from '@backstage/plugin-azure-devops';
import type * as PluginGithubActions from '@backstage/plugin-github-actions';
import type * as PluginGrafana from '@k-phoen/backstage-plugin-grafana';
import type * as PluginTechdocs from '@backstage/plugin-techdocs';
import type * as PluginTechdocsReact from '@backstage/plugin-techdocs-react';
import type * as PluginTechdocsModuleAddonsContrib from '@backstage/plugin-techdocs-module-addons-contrib';
import type * as PluginFlux from '@weaveworksoss/backstage-plugin-flux';
import type * as PluginKubernetes from '@backstage/plugin-kubernetes';
import type * as PluginAdp from '@internal/plugin-adp';
import type * as PluginGithubPullRequestsBoard from '@backstage/plugin-github-pull-requests-board';
import type * as PluginCatalogGraph from '@backstage/plugin-catalog-graph';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { entityPage } from './EntityPage';
import type { Entity } from '@backstage/catalog-model';
import type {
  CatalogApi,
  StarredEntitiesApi,
} from '@backstage/plugin-catalog-react';
import {
  EntityProvider,
  catalogApiRef,
  entityRouteRef,
  starredEntitiesApiRef,
} from '@backstage/plugin-catalog-react';
import { waitFor } from '@testing-library/dom';
import {
  type FeatureFlagsApi,
  featureFlagsApiRef,
} from '@backstage/core-plugin-api';
import { catalogPlugin } from '@backstage/plugin-catalog';
import type { PermissionApi } from '@backstage/plugin-permission-react';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import type { Observable } from '@backstage/types';
import { catalogGraphPlugin } from '@backstage/plugin-catalog-graph';
import { SnapshotFriendlyStylesProvider } from '@internal/plugin-adp';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import type { RenderResult } from '@testing-library/react';
import { randomUUID } from 'node:crypto';

function itShouldRenderTabs(when: string, entity: Entity): void;
function itShouldRenderTabs(entity: Entity): void;
function itShouldRenderTabs(...args: [string, Entity] | [Entity]) {
  const [when, entity] = args.length === 1 ? ['', ...args] : args;
  // eslint-disable-next-line jest/valid-title
  it(`Should render tabs ${when}`.trim(), async () => {
    const { render } = setup();
    const result = await render(entity);
    expect(pageTabs(result)).toMatchSnapshot('tabs');
  });
}

function itShouldRenderEntityHome(
  when: string,
  tabName: string,
  entity: Entity,
): void;
function itShouldRenderEntityHome(tabName: string, entity: Entity): void;
function itShouldRenderEntityHome(
  ...args: [string, string, Entity] | [string, Entity]
) {
  const [when, tabName, entity] = args.length === 2 ? ['', ...args] : args;
  // eslint-disable-next-line jest/valid-title
  it(`Should render correctly ${when}`.trim(), async () => {
    const { render } = setup();

    const result = await render(entity);

    expect(pageContent(result)).toMatchSnapshot('content');
    const beforeNavigate = pageContent(result).map(e =>
      e.map(x => x.outerHTML),
    );
    await navigateToTab(result, tabName);
    expect(pageContent(result).map(e => e.map(x => x.outerHTML))).toMatchObject(
      beforeNavigate,
    );
  });
}

function itShouldRenderEntityPage(
  when: string,
  tabName: string,
  entity: Entity,
): void;
function itShouldRenderEntityPage(tabName: string, entity: Entity): void;
function itShouldRenderEntityPage(
  ...args: [string, string, Entity] | [string, Entity]
) {
  const [when, tabName, entity] = args.length === 2 ? ['', ...args] : args;
  // eslint-disable-next-line jest/valid-title
  it(`Should render correctly ${when}`.trim(), async () => {
    const { render } = setup();

    const result = await render(entity);
    await navigateToTab(result, tabName);

    expect(pageContent(result)).toMatchSnapshot('content');
  });
}

describe('[kind: component]', () => {
  function getEntities(type: string) {
    return {
      base: {
        kind: 'component',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
        spec: {
          type,
        },
      },
      kubernetes: {
        kind: 'component',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
          annotations: {
            'backstage.io/kubernetes-id': '123',
          },
        },
        spec: {
          type,
        },
      },
      azurePipelines: {
        kind: 'component',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
          annotations: {
            'dev.azure.com/project': 'DEFRA-TEST',
            'dev.azure.com/build-definition': '123',
          },
        },
        spec: {
          type,
        },
      },
      githubActions: {
        kind: 'component',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
          annotations: {
            'github.com/project-slug': 'my-project',
          },
        },
        spec: {
          type,
        },
      },
    } as const satisfies Record<string, Entity>;
  }
  describe.each(['backend', 'service'])('[type: %s]', type => {
    const entities = getEntities(type);
    describe('tabs', () => {
      itShouldRenderTabs('when there is no kubernetes', entities.base);
      itShouldRenderTabs('when there is kubernetes', entities.kubernetes);
    });
    describe('/', () => {
      itShouldRenderEntityHome('Overview', entities.base);
    });
    describe('/ci-cd', () => {
      itShouldRenderEntityPage(
        'when cicd is not available',
        'CI/CD',
        entities.base,
      );
      itShouldRenderEntityPage(
        'when azure pipelines are available',
        'CI/CD',
        entities.azurePipelines,
      );
      itShouldRenderEntityPage(
        'when github actions are available',
        'CI/CD',
        entities.githubActions,
      );
    });
    describe('/pull-requests', () => {
      itShouldRenderEntityPage('Pull Requests', entities.base);
    });
    describe('/grafana', () => {
      itShouldRenderEntityPage('Grafana', entities.base);
    });
    describe('/api', () => {
      itShouldRenderEntityPage('API', entities.base);
    });
    describe('/dependencies', () => {
      itShouldRenderEntityPage('Dependencies', entities.base);
    });
    describe('/docs', () => {
      itShouldRenderEntityPage('Docs', entities.base);
    });
    describe('/releases', () => {
      itShouldRenderEntityPage('Deployments', entities.kubernetes);
    });
    describe('/kubernetes', () => {
      itShouldRenderEntityPage('Kubernetes', entities.kubernetes);
    });
  });
  describe.each(['frontend', 'website'])('[type: %s]', type => {
    const entities = getEntities(type);
    describe('tabs', () => {
      itShouldRenderTabs('when there is no kubernetes', entities.base);
      itShouldRenderTabs('when there is kubernetes', entities.kubernetes);
    });
    describe('/', () => {
      itShouldRenderEntityHome('Overview', entities.base);
    });
    describe('/ci-cd', () => {
      itShouldRenderEntityPage(
        'when cicd is not available',
        'CI/CD',
        entities.base,
      );
      itShouldRenderEntityPage(
        'when azure pipelines are available',
        'CI/CD',
        entities.azurePipelines,
      );
      itShouldRenderEntityPage(
        'when github actions are available',
        'CI/CD',
        entities.githubActions,
      );
    });
    describe('/pull-requests', () => {
      itShouldRenderEntityPage('Pull Requests', entities.base);
    });
    describe('/grafana', () => {
      itShouldRenderEntityPage('Grafana', entities.base);
    });
    describe('/dependencies', () => {
      itShouldRenderEntityPage('Dependencies', entities.base);
    });
    describe('/docs', () => {
      itShouldRenderEntityPage('Docs', entities.base);
    });
    describe('/releases', () => {
      itShouldRenderEntityPage('Deployments', entities.kubernetes);
    });
    describe('/kubernetes', () => {
      itShouldRenderEntityPage('Kubernetes', entities.kubernetes);
    });
  });
  describe('[type: helm]', () => {
    const entities = getEntities('helm');
    describe('tabs', () => {
      itShouldRenderTabs('when there is no kubernetes', entities.base);
      itShouldRenderTabs('when there is kubernetes', entities.kubernetes);
    });
    describe('/', () => {
      itShouldRenderEntityHome('Overview', entities.base);
    });
    describe('/ci-cd', () => {
      itShouldRenderEntityPage(
        'when cicd is not available',
        'CI/CD',
        entities.base,
      );
      itShouldRenderEntityPage(
        'when azure pipelines are available',
        'CI/CD',
        entities.azurePipelines,
      );
      itShouldRenderEntityPage(
        'when github actions are available',
        'CI/CD',
        entities.githubActions,
      );
    });
    describe('/pull-requests', () => {
      itShouldRenderEntityPage('Pull Requests', entities.base);
    });
    describe('/dependencies', () => {
      itShouldRenderEntityPage('Dependencies', entities.base);
    });
    describe('/docs', () => {
      itShouldRenderEntityPage('Docs', entities.base);
    });
    describe('/releases', () => {
      itShouldRenderEntityPage('Deployments', entities.kubernetes);
    });
    describe('/kubernetes', () => {
      itShouldRenderEntityPage('Kubernetes', entities.kubernetes);
    });
  });
  describe('[type: ???]', () => {
    const entities = getEntities(randomUUID());
    describe('tabs', () => {
      itShouldRenderTabs('when there is no kubernetes', entities.base);
      itShouldRenderTabs('when there is kubernetes', entities.kubernetes);
    });
    describe('/', () => {
      itShouldRenderEntityHome('Overview', entities.base);
    });
    describe('/docs', () => {
      itShouldRenderEntityPage('Docs', entities.base);
    });
  });
});
describe('[kind: api]', () => {
  const entity = {
    kind: 'api',
    apiVersion: '1',
    metadata: {
      name: 'my-entity',
    },
  } as const satisfies Entity;
  describe('tabs', () => {
    itShouldRenderTabs(entity);
  });
  describe('/', () => {
    itShouldRenderEntityHome('Overview', entity);
  });
  describe('/definition', () => {
    itShouldRenderEntityPage('Definition', entity);
  });
});
describe('[kind: group]', () => {
  const entities = {
    base: {
      kind: 'group',
      apiVersion: '1',
      metadata: {
        name: 'my-entity',
      },
    },
    deliveryProgramme: {
      kind: 'group',
      apiVersion: '1',
      metadata: {
        name: 'my-entity',
      },
      spec: {
        type: 'delivery-programme',
      },
    },
    deliveryProject: {
      kind: 'group',
      apiVersion: '1',
      metadata: {
        name: 'my-entity',
      },
      spec: {
        type: 'delivery-project',
      },
    },
    kubernetes: {
      kind: 'group',
      apiVersion: '1',
      metadata: {
        name: 'my-entity',
        annotations: {
          'backstage.io/kubernetes-id': '123',
        },
      },
    },
  } as const satisfies Record<string, Entity>;
  describe('tabs', () => {
    itShouldRenderTabs(entities.base);
    itShouldRenderTabs(
      'when is a delivery programme',
      entities.deliveryProgramme,
    );
    itShouldRenderTabs('when is a delivery project', entities.deliveryProject);
    itShouldRenderTabs('when there is kubernetes', entities.kubernetes);
  });
  describe('/', () => {
    itShouldRenderEntityHome('Overview', entities.base);
  });
  describe('/pull-requests', () => {
    itShouldRenderEntityPage('Pull Requests', entities.base);
  });
  describe('/manage-delivery-programme-admins', () => {
    itShouldRenderEntityPage('Manage Members', entities.deliveryProgramme);
  });
  describe('/manage-delivery-project-users', () => {
    itShouldRenderEntityPage('Manage Members', entities.deliveryProject);
  });
  describe('/releases', () => {
    itShouldRenderEntityPage('Deployments', entities.kubernetes);
  });
  describe('/kubernetes', () => {
    itShouldRenderEntityPage('Kubernetes', entities.kubernetes);
  });
});
describe('[kind: user]', () => {
  const entity = {
    kind: 'user',
    apiVersion: '1',
    metadata: {
      name: 'my-entity',
    },
  } as const satisfies Entity;
  describe('tabs', () => {
    itShouldRenderTabs(entity);
  });
  describe('/', () => {
    itShouldRenderEntityHome('Overview', entity);
  });
});
describe('[kind: system]', () => {
  const entity = {
    kind: 'system',
    apiVersion: '1',
    metadata: {
      name: 'my-entity',
    },
  } as const satisfies Entity;
  describe('tabs', () => {
    itShouldRenderTabs(entity);
  });
  describe('/', () => {
    itShouldRenderEntityHome('Overview', entity);
  });
  describe('/diagram', () => {
    itShouldRenderEntityPage('Diagram', entity);
  });
});
describe('[kind: domain]', () => {
  const entity = {
    kind: 'domain',
    apiVersion: '1',
    metadata: {
      name: 'my-entity',
    },
  } as const satisfies Entity;
  describe('tabs', () => {
    itShouldRenderTabs(entity);
  });
  describe('/', () => {
    itShouldRenderEntityHome('Overview', entity);
  });
});
describe('[kind: ???]', () => {
  const entity = {
    kind: randomUUID(),
    apiVersion: '1',
    metadata: {
      name: 'my-entity',
    },
  } as const satisfies Entity;
  describe('tabs', () => {
    itShouldRenderTabs(entity);
  });
  describe('/', () => {
    itShouldRenderEntityHome('Overview', entity);
  });
  describe('/docs', () => {
    itShouldRenderEntityPage('Docs', entity);
  });
});

async function navigateToTab(result: RenderResult, tabText: string) {
  await act(async () => {
    const tabs = [
      ...result.baseElement.querySelectorAll(`.MuiTabs-flexContainer > button`),
    ];
    expect(tabs).not.toBeNull();
    expect(tabs.map(x => x.textContent)).toContain(tabText);
    const tab = tabs.filter(t => t.textContent === tabText);
    expect(tab).toHaveLength(1);
    await userEvent.click(tab[0]);
  });
}

function pageContent(result: RenderResult) {
  return [...result.baseElement.querySelectorAll('.BackstageContent-root')].map(
    elem => [...elem.children],
  );
}

function pageTabs(result: RenderResult) {
  return [...result.baseElement.querySelectorAll('.MuiTabs-flexContainer')].map(
    elem => [...elem.children],
  );
}

function setup() {
  const mockFeatureFlagApi: jest.Mocked<FeatureFlagsApi> = {
    getRegisteredFlags: jest.fn(),
    isActive: jest.fn(),
    registerFlag: jest.fn(),
    save: jest.fn(),
  };

  const mockCatalogApi: jest.Mocked<CatalogApi> = {
    addLocation: jest.fn(),
    getEntities: jest.fn(),
    getEntitiesByRefs: jest.fn(),
    getEntityAncestors: jest.fn(),
    getEntityByRef: jest.fn(),
    getEntityFacets: jest.fn(),
    getLocationByEntity: jest.fn(),
    getLocationById: jest.fn(),
    getLocationByRef: jest.fn(),
    queryEntities: jest.fn(),
    refreshEntity: jest.fn(),
    removeEntityByUid: jest.fn(),
    removeLocationById: jest.fn(),
    validateEntity: jest.fn(),
  };

  const mockedStarredEntitiesApi: jest.Mocked<StarredEntitiesApi> = {
    starredEntitie$: jest.fn(),
    toggleStarred: jest.fn(),
  };

  const mockPermissionsApi: jest.Mocked<PermissionApi> = {
    authorize: jest.fn(),
  };

  mockCatalogApi.getEntityAncestors.mockImplementation(e =>
    Promise.resolve({
      items: [],
      rootEntityRef: e.entityRef,
    }),
  );

  const mockStarredObservable: jest.Mocked<Observable<Set<string>>> = {
    [Symbol.observable]: jest.fn(),
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn(), closed: false })),
  };
  mockedStarredEntitiesApi.starredEntitie$.mockReturnValue(
    mockStarredObservable,
  );

  const render = async function render(entity: Entity) {
    const result = await renderInTestApp(
      <TestApiProvider
        apis={[
          [featureFlagsApiRef, mockFeatureFlagApi],
          [catalogApiRef, mockCatalogApi],
          [starredEntitiesApiRef, mockedStarredEntitiesApi],
          [permissionApiRef, mockPermissionsApi],
        ]}
      >
        <EntityProvider entity={entity}>
          <SnapshotFriendlyStylesProvider>
            {entityPage()}
          </SnapshotFriendlyStylesProvider>
        </EntityProvider>
      </TestApiProvider>,
      {
        mountedRoutes: {
          '/catalog/:namespace/:kind/:name/*': entityRouteRef,
          '/catalog': catalogPlugin.routes.catalogIndex,
          '/catalog/gql': catalogGraphPlugin.routes.catalogGraph,
        },
      },
    );

    await waitFor(() => expect(result.baseElement).not.toBeEmptyDOMElement());
    return result;
  };

  return {
    render,
    mockFeatureFlagApi,
    mockCatalogApi,
    mockedStarredEntitiesApi,
    mockStarredObservable,
    mockPermissionsApi,
  };
}

function proxyModule<T>(
  moduleName: string,
  getMocked: () => Partial<jest.Mocked<T>>,
) {
  return new Proxy(
    {},
    {
      get(_target, p) {
        const mocked = getMocked();
        if (p in mocked) return mocked[p as keyof T];
        return jest.requireActual(moduleName)[p];
      },
    },
  );
}

const prefixHyphen = (v: string) => `-${v}`;
function mockComponent<T extends string>(
  name: T,
): { [P in T]: jest.Mock<React.JSX.Element> };
function mockComponent<T extends string, Additional = {}>(
  name: T,
  additional: Additional,
): { [P in T]: jest.Mock<React.JSX.Element> & Additional };
function mockComponent<T extends string, Additional = {}>(
  name: T,
  additional?: Additional,
) {
  return {
    [name]: Object.assign(
      jest.fn(({ children, ...props }, ..._) =>
        React.createElement(
          `mocked-${name.replaceAll(/(?<!^)[A-Z]/g, prefixHyphen)}`,
          props,
          children,
        ),
      ),
      additional ?? {},
    ),
  };
}

const mockPluginOrg = {
  ...mockComponent('EntityUserProfileCard'),
  ...mockComponent('EntityGroupProfileCard'),
  ...mockComponent('EntityMembersListCard'),
  ...mockComponent('EntityOwnershipCard'),
} satisfies Partial<jest.Mocked<typeof PluginOrg>>;
jest.mock('@backstage/plugin-org', () =>
  proxyModule('@backstage/plugin-org', () => mockPluginOrg),
);

const mockPluginCatalog = {
  ...mockComponent('EntityAboutCard'),
  ...mockComponent('EntityDependsOnComponentsCard'),
  ...mockComponent('EntityDependsOnResourcesCard'),
  ...mockComponent('EntityHasComponentsCard'),
  ...mockComponent('EntityHasResourcesCard'),
  ...mockComponent('EntityHasSubcomponentsCard'),
  ...mockComponent('EntityHasSystemsCard'),
  ...mockComponent('EntityLinksCard'),
} satisfies Partial<jest.Mocked<typeof PluginCatalog>>;
jest.mock('@backstage/plugin-catalog', () =>
  proxyModule('@backstage/plugin-catalog', () => mockPluginCatalog),
);

const mockPluginApiDocs = {
  ...mockComponent('EntityHasApisCard'),
  ...mockComponent('EntityApiDefinitionCard'),
  ...mockComponent('EntityProvidedApisCard'),
  ...mockComponent('EntityConsumedApisCard'),
} satisfies Partial<jest.Mocked<typeof PluginApiDocs>>;
jest.mock('@backstage/plugin-api-docs', () =>
  proxyModule('@backstage/plugin-api-docs', () => mockPluginApiDocs),
);

const mockPluginAzureDevops = {
  ...mockComponent('EntityAzurePipelinesContent'),
} satisfies Partial<jest.Mocked<typeof PluginAzureDevops>>;
jest.mock('@backstage/plugin-azure-devops', () =>
  proxyModule('@backstage/plugin-azure-devops', () => mockPluginAzureDevops),
);

const mockPluginGithubActions = {
  ...mockComponent('EntityGithubActionsContent'),
} satisfies Partial<jest.Mocked<typeof PluginGithubActions>>;
jest.mock('@backstage/plugin-github-actions', () =>
  proxyModule(
    '@backstage/plugin-github-actions',
    () => mockPluginGithubActions,
  ),
);

const mockPluginGithubPullRequests = {
  ...mockComponent('EntityGithubPullRequestsContent'),
} satisfies Partial<jest.Mocked<typeof PluginGithubPullRequests>>;
jest.mock('@roadiehq/backstage-plugin-github-pull-requests', () =>
  proxyModule(
    '@roadiehq/backstage-plugin-github-pull-requests',
    () => mockPluginGithubPullRequests,
  ),
);

const mockPluginGrafana = {
  ...mockComponent('EntityGrafanaDashboardsCard'),
  ...mockComponent('EntityGrafanaAlertsCard'),
} satisfies Partial<jest.Mocked<typeof PluginGrafana>>;
jest.mock('@k-phoen/backstage-plugin-grafana', () =>
  proxyModule('@k-phoen/backstage-plugin-grafana', () => mockPluginGrafana),
);
const mockPluginTechdocs = {
  ...mockComponent('EntityTechdocsContent'),
} satisfies Partial<jest.Mocked<typeof PluginTechdocs>>;
jest.mock('@backstage/plugin-techdocs', () =>
  proxyModule('@backstage/plugin-techdocs', () => mockPluginTechdocs),
);

const mockPluginTechdocsReact = {
  ...mockComponent('TechDocsAddons'),
} satisfies Partial<jest.Mocked<typeof PluginTechdocsReact>>;
jest.mock('@backstage/plugin-techdocs-react', () =>
  proxyModule(
    '@backstage/plugin-techdocs-react',
    () => mockPluginTechdocsReact,
  ),
);

const mockPluginTechdocsModuleAddonsContrib = {
  ...mockComponent('ReportIssue'),
} satisfies Partial<jest.Mocked<typeof PluginTechdocsModuleAddonsContrib>>;
jest.mock('@backstage/plugin-techdocs-module-addons-contrib', () =>
  proxyModule(
    '@backstage/plugin-techdocs-module-addons-contrib',
    () => mockPluginTechdocsModuleAddonsContrib,
  ),
);

const mockPluginFlux = {
  ...mockComponent('EntityFluxHelmReleasesCard'),
  ...mockComponent('EntityFluxHelmRepositoriesCard'),
  ...mockComponent('EntityFluxKustomizationsCard'),
  ...mockComponent('EntityFluxImagePoliciesCard'),
} satisfies Partial<jest.Mocked<typeof PluginFlux>>;
jest.mock('@weaveworksoss/backstage-plugin-flux', () =>
  proxyModule('@weaveworksoss/backstage-plugin-flux', () => mockPluginFlux),
);

const mockPluginKubernetes = {
  ...mockComponent('EntityKubernetesContent'),
} satisfies Partial<jest.Mocked<typeof PluginKubernetes>>;
jest.mock('@backstage/plugin-kubernetes', () =>
  proxyModule('@backstage/plugin-kubernetes', () => mockPluginKubernetes),
);

const mockPluginAdp = {
  ...mockComponent('EntityPageManageProgrammeAdminContent'),
  ...mockComponent('EntityPageManageProjectUserContent'),
} satisfies Partial<jest.Mocked<typeof PluginAdp>>;
jest.mock('@internal/plugin-adp', () =>
  proxyModule('@internal/plugin-adp', () => mockPluginAdp),
);

const mockPluginGithubPullRequestsBoard = {
  ...mockComponent('EntityTeamPullRequestsCard'),
  ...mockComponent('EntityTeamPullRequestsContent'),
} satisfies Partial<jest.Mocked<typeof PluginGithubPullRequestsBoard>>;
jest.mock('@backstage/plugin-github-pull-requests-board', () =>
  proxyModule(
    '@backstage/plugin-github-pull-requests-board',
    () => mockPluginGithubPullRequestsBoard,
  ),
);

const mockPluginCatalogGraph = {
  ...mockComponent('EntityCatalogGraphCard'),
} satisfies Partial<jest.Mocked<typeof PluginCatalogGraph>>;
jest.mock('@backstage/plugin-catalog-graph', () =>
  proxyModule('@backstage/plugin-catalog-graph', () => mockPluginCatalogGraph),
);
