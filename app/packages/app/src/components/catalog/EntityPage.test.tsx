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

describe('[kind: component]', () => {
  describe.each(['backend', 'service'])('[type: %s]', type => {
    describe('tabs', () => {
      it('Should render correctly when kubernetes is not available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        expect(pageTabs(result)).toMatchSnapshot('tabs');
      });
      it('Should render correctly when kubernetes is available', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        expect(pageTabs(result)).toMatchSnapshot('content');
      });
    });
    describe('/', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        expect(pageContent(result)).toMatchSnapshot('content');

        const beforeNavigate = result.baseElement.outerHTML;
        await navigateToTab(result, 'Overview');
        expect(result.baseElement.outerHTML).toBe(beforeNavigate);
      });
    });
    describe('/ci-cd', () => {
      it('Should render correctly when cicd is not available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
      it('Should render correctly when azure pipelines are available', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
      it('Should render correctly when github actions are available', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/pull-requests', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'Pull Requests');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/grafana', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'Grafana');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/api', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'API');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/dependencies', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'Dependencies');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/docs', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'Docs');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/releases', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        await navigateToTab(result, 'Deployments');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/kubernetes', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        await navigateToTab(result, 'Kubernetes');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
  });
  describe.each(['frontend', 'website'])('[type: %s]', type => {
    describe('tabs', () => {
      it('Should render correctly when kubernetes is not available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        expect(pageTabs(result)).toMatchSnapshot('tabs');
      });
      it('Should render correctly when kubernetes is available', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        expect(pageTabs(result)).toMatchSnapshot('content');
      });
    });
    describe('/', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        expect(pageContent(result)).toMatchSnapshot('content');

        const beforeNavigate = result.baseElement.outerHTML;
        await navigateToTab(result, 'Overview');
        expect(result.baseElement.outerHTML).toBe(beforeNavigate);
      });
    });
    describe('/ci-cd', () => {
      it('Should render correctly when cicd is not available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
      it('Should render correctly when azure pipelines are available', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
      it('Should render correctly when github actions are available', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/pull-requests', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'Pull Requests');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/grafana', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'Grafana');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/dependencies', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'Dependencies');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/docs', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type,
          },
        });

        await navigateToTab(result, 'Docs');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/releases', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        await navigateToTab(result, 'Deployments');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/kubernetes', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
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
        });

        await navigateToTab(result, 'Kubernetes');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
  });
  describe('[type: helm]', () => {
    describe('tabs', () => {
      it('Should render correctly when kubernetes is not available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: 'helm',
          },
        });

        expect(pageTabs(result)).toMatchSnapshot('tabs');
      });
      it('Should render correctly when kubernetes is available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
            annotations: {
              'backstage.io/kubernetes-id': '123',
            },
          },
          spec: {
            type: 'helm',
          },
        });

        expect(pageTabs(result)).toMatchSnapshot('content');
      });
    });
    describe('/', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: 'helm',
          },
        });

        expect(pageContent(result)).toMatchSnapshot('content');

        const beforeNavigate = result.baseElement.outerHTML;
        await navigateToTab(result, 'Overview');
        expect(result.baseElement.outerHTML).toBe(beforeNavigate);
      });
    });
    describe('/ci-cd', () => {
      it('Should render correctly when cicd is not available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: 'helm',
          },
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
      it('Should render correctly when azure pipelines are available', async () => {
        const { render } = setup();
        const result = await render({
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
            type: 'helm',
          },
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
      it('Should render correctly when github actions are available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
            annotations: {
              'github.com/project-slug': 'my-project',
            },
          },
          spec: {
            type: 'helm',
          },
        });

        await navigateToTab(result, 'CI/CD');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/pull-requests', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: 'helm',
          },
        });

        await navigateToTab(result, 'Pull Requests');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/dependencies', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: 'helm',
          },
        });

        await navigateToTab(result, 'Dependencies');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/docs', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: 'helm',
          },
        });

        await navigateToTab(result, 'Docs');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/releases', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
            annotations: {
              'backstage.io/kubernetes-id': '123',
            },
          },
          spec: {
            type: 'helm',
          },
        });

        await navigateToTab(result, 'Deployments');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
    describe('/kubernetes', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
            annotations: {
              'backstage.io/kubernetes-id': '123',
            },
          },
          spec: {
            type: 'helm',
          },
        });

        await navigateToTab(result, 'Kubernetes');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
  });
  describe('[type: ???]', () => {
    describe('tabs', () => {
      it('Should render correctly when kubernetes is not available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: randomUUID(),
          },
        });

        expect(pageTabs(result)).toMatchSnapshot('tabs');
      });
      it('Should render correctly when kubernetes is available', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
            annotations: {
              'backstage.io/kubernetes-id': '123',
            },
          },
          spec: {
            type: randomUUID(),
          },
        });

        expect(pageTabs(result)).toMatchSnapshot('content');
      });
    });
    describe('/', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: randomUUID(),
          },
        });

        expect(pageContent(result)).toMatchSnapshot('content');

        const beforeNavigate = result.baseElement.outerHTML;
        await navigateToTab(result, 'Overview');
        expect(result.baseElement.outerHTML).toBe(beforeNavigate);
      });
    });
    describe('/docs', () => {
      it('Should render correctly', async () => {
        const { render } = setup();
        const result = await render({
          kind: 'component',
          apiVersion: '1',
          metadata: {
            name: 'my-entity',
          },
          spec: {
            type: randomUUID(),
          },
        });

        await navigateToTab(result, 'Docs');

        expect(pageContent(result)).toMatchSnapshot('content');
      });
    });
  });
});
describe('[kind: api]', () => {
  describe('tabs', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'api',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageTabs(result)).toMatchSnapshot('tabs');
    });
  });
  describe('/', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'api',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageContent(result)).toMatchSnapshot('content');

      const beforeNavigate = result.baseElement.outerHTML;
      await navigateToTab(result, 'Overview');
      expect(result.baseElement.outerHTML).toBe(beforeNavigate);
    });
  });
  describe('/definition', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'api',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      await navigateToTab(result, 'Definition');

      expect(pageContent(result)).toMatchSnapshot('content');
    });
  });
});
describe('[kind: group]', () => {
  describe('tabs', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'group',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageTabs(result)).toMatchSnapshot('tabs');
    });
    it('Should render correctly with manage members', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'group',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
        spec: {
          type: 'delivery-programme',
        },
      });

      expect(pageTabs(result)).toMatchSnapshot('tabs');
    });
    it('Should render correctly with kubernetes', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'group',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
          annotations: {
            'backstage.io/kubernetes-id': '123',
          },
        },
      });

      expect(pageTabs(result)).toMatchSnapshot('tabs');
    });
  });
  describe('/', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'group',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageContent(result)).toMatchSnapshot('content');

      const beforeNavigate = result.baseElement.outerHTML;
      await navigateToTab(result, 'Overview');
      expect(result.baseElement.outerHTML).toBe(beforeNavigate);
    });
  });
  describe('/pull-requests', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'group',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      await navigateToTab(result, 'Pull Requests');

      expect(pageContent(result)).toMatchSnapshot('content');
    });
  });
  describe('/manage-members', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'group',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
        spec: {
          type: 'delivery-programme',
        },
      });

      await navigateToTab(result, 'Manage Members');

      expect(pageContent(result)).toMatchSnapshot('content');
    });
  });
  describe('/releases', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'group',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
          annotations: {
            'backstage.io/kubernetes-id': '123',
          },
        },
      });

      await navigateToTab(result, 'Deployments');

      expect(pageContent(result)).toMatchSnapshot('content');
    });
  });
  describe('/kubernetes', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'group',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
          annotations: {
            'backstage.io/kubernetes-id': '123',
          },
        },
      });

      await navigateToTab(result, 'Kubernetes');

      expect(pageContent(result)).toMatchSnapshot('content');
    });
  });
});
describe('[kind: user]', () => {
  describe('tabs', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'user',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageTabs(result)).toMatchSnapshot('tabs');
    });
  });
  describe('/', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'user',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageContent(result)).toMatchSnapshot('content');

      const beforeNavigate = result.baseElement.outerHTML;
      await navigateToTab(result, 'Overview');
      expect(result.baseElement.outerHTML).toBe(beforeNavigate);
    });
  });
});
describe('[kind: system]', () => {
  describe('tabs', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'system',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageTabs(result)).toMatchSnapshot('tabs');
    });
  });
  describe('/', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'system',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageContent(result)).toMatchSnapshot('content');

      const beforeNavigate = result.baseElement.outerHTML;
      await navigateToTab(result, 'Overview');
      expect(result.baseElement.outerHTML).toBe(beforeNavigate);
    });
  });
  describe('/diagram', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'system',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      await navigateToTab(result, 'Diagram');

      expect(pageContent(result)).toMatchSnapshot('content');
    });
  });
});
describe('[kind: domain]', () => {
  describe('tabs', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'domain',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageTabs(result)).toMatchSnapshot('tabs');
    });
  });
  describe('/', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: 'domain',
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageContent(result)).toMatchSnapshot('content');

      const beforeNavigate = result.baseElement.outerHTML;
      await navigateToTab(result, 'Overview');
      expect(result.baseElement.outerHTML).toBe(beforeNavigate);
    });
  });
});
describe('[kind: ???]', () => {
  describe('tabs', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: randomUUID(),
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageTabs(result)).toMatchSnapshot('tabs');
    });
  });
  describe('/', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: randomUUID(),
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      expect(pageContent(result)).toMatchSnapshot('content');

      const beforeNavigate = result.baseElement.outerHTML;
      await navigateToTab(result, 'Overview');
      expect(result.baseElement.outerHTML).toBe(beforeNavigate);
    });
  });
  describe('/docs', () => {
    it('Should render correctly', async () => {
      const { render } = setup();
      const result = await render({
        kind: randomUUID(),
        apiVersion: '1',
        metadata: {
          name: 'my-entity',
        },
      });

      await navigateToTab(result, 'Docs');

      expect(pageContent(result)).toMatchSnapshot('content');
    });
  });
});

async function navigateToTab(result: RenderResult, tabText: string) {
  await act(async () => {
    const tabs = result.baseElement.querySelectorAll(
      `.MuiTabs-flexContainer > button`,
    );
    expect(tabs).not.toBeNull();
    const tab = [...tabs].filter(t => t.textContent === tabText);
    expect(tab).toHaveLength(1);
    await userEvent.click(tab[0]);
  });
  await waitForNoRipple(result);
}

async function waitForNoRipple(result: RenderResult) {
  await waitFor(() =>
    expect(
      result.baseElement.querySelector('.MuiTouchRipple-rippleVisible'),
    ).toBeNull(),
  );
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
