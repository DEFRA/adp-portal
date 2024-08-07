import React from 'react';
import type { Entity } from '@backstage/catalog-model';
import type { DeliveryProjectUserApi } from './api';
import { deliveryProjectUserApiRef } from './api';
import { errorApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import {
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import { DeliveryProjectUserViewPage } from './DeliveryProjectUserViewPage';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import { waitFor } from '@testing-library/react';
import type * as AddProjectUserButtonModule from './AddProjectUserButton';
import type * as EditDeliveryProjectUserButtonModule from './EditDeliveryProjectUserButton';
import { SnapshotFriendlyStylesProvider } from '../../utils';
import { Button } from '@material-ui/core';
import { inspect } from 'node:util';
import type * as RemoveDeliveryProjectUserButtonModule from './RemoveDeliveryProjectUserButton';

const AddProjectUserButton: jest.MockedFn<
  (typeof AddProjectUserButtonModule)['AddProjectUserButton']
> = jest.fn();

const EditDeliveryProjectUserButton: jest.MockedFn<
  (typeof EditDeliveryProjectUserButtonModule)['EditDeliveryProjectUserButton']
> = jest.fn();

const RemoveDeliveryProjectUserButton: jest.MockedFn<
  (typeof RemoveDeliveryProjectUserButtonModule)['RemoveDeliveryProjectUserButton']
> = jest.fn();

jest.mock(
  './AddProjectUserButton',
  () =>
    ({
      get AddProjectUserButton() {
        return AddProjectUserButton;
      },
    }) satisfies typeof AddProjectUserButtonModule,
);

jest.mock(
  './EditDeliveryProjectUserButton',
  () =>
    ({
      get EditDeliveryProjectUserButton() {
        return EditDeliveryProjectUserButton;
      },
    }) satisfies typeof EditDeliveryProjectUserButtonModule,
);

jest.mock(
  './RemoveDeliveryProjectUserButton',
  () =>
    ({
      get RemoveDeliveryProjectUserButton() {
        return RemoveDeliveryProjectUserButton;
      },
    }) satisfies typeof RemoveDeliveryProjectUserButtonModule,
);

function setup() {
  const mockDeliveryProjectUserApi: jest.Mocked<DeliveryProjectUserApi> = {
    getAll: jest.fn(),
    getByDeliveryProjectId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockErrorApi = { post: jest.fn() };

  const groupEntity = {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-group',
      annotations: {
        'adp.defra.gov.uk/delivery-project-id': '123',
      },
    },
  } as Entity;

  return {
    mockDeliveryProjectUserApi,
    mockErrorApi,
    async renderComponent() {
      const result = await renderInTestApp(
        <TestApiProvider
          apis={[
            [errorApiRef, mockErrorApi],
            [deliveryProjectUserApiRef, mockDeliveryProjectUserApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <EntityProvider entity={groupEntity}>
              <DeliveryProjectUserViewPage />
            </EntityProvider>
          </SnapshotFriendlyStylesProvider>
        </TestApiProvider>,
        {
          mountedRoutes: {
            '/catalog/:namespace/:kind/:name/*': entityRouteRef,
          },
        },
      );

      await waitFor(() => {
        expect(result.getByText('Delivery Project Users')).toBeInTheDocument();
      });

      return result;
    },
  };
}

function createDeliveryProjectUsers(count: number) {
  return [...new Array(count)].map<DeliveryProjectUser>((_, i) => ({
    aad_entity_ref_id: '123',
    delivery_project_id: '123',
    email: `test-${i}@test.com`,
    id: i.toString(),
    name: `Delivery Project User ${i}`,
    updated_at: new Date(0),
    is_admin: false,
    is_technical: true,
    github_username: count % 2 === 0 ? `test-user-${count}` : undefined,
  }));
}

describe('DeliveryProjectUserViewPage', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0);

    AddProjectUserButton.mockImplementation(
      ({ onCreated, deliveryProjectId, entityRef, children, ...props }) => (
        <Button {...props} onClick={onCreated}>
          {children}
          {inspect({ deliveryProjectId, entityRef })}
        </Button>
      ),
    );

    EditDeliveryProjectUserButton.mockImplementation(
      ({ onEdited, deliveryProjectUser, children, ...props }) => (
        <Button {...props} onClick={onEdited}>
          {children}
          {inspect({ deliveryProjectUser: noTableData(deliveryProjectUser) })}
        </Button>
      ),
    );

    RemoveDeliveryProjectUserButton.mockImplementation(
      ({ onRemoved, deliveryProjectUser, children, ...props }) => (
        <Button {...props} onClick={onRemoved}>
          {children}
          {inspect({ deliveryProjectUser: noTableData(deliveryProjectUser) })}
        </Button>
      ),
    );
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
    jest.clearAllMocks();
  });

  it('should render the page with Delivery Project Users correctly', async () => {
    const { mockDeliveryProjectUserApi, renderComponent, mockErrorApi } =
      setup();
    const expectedDeliveryProjectUsers = createDeliveryProjectUsers(5);
    mockDeliveryProjectUserApi.getByDeliveryProjectId.mockResolvedValue(
      expectedDeliveryProjectUsers,
    );

    const rendered = await renderComponent();

    expect(rendered.baseElement).toMatchSnapshot();
    expect(
      mockDeliveryProjectUserApi.getByDeliveryProjectId.mock.calls,
    ).toMatchObject([['123']]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
  });

  it('should render the page with no Delivery Project Users correctly', async () => {
    const { mockDeliveryProjectUserApi, renderComponent, mockErrorApi } =
      setup();
    mockDeliveryProjectUserApi.getByDeliveryProjectId.mockResolvedValue([]);

    const rendered = await renderComponent();

    expect(rendered.baseElement).toMatchSnapshot();
    expect(
      mockDeliveryProjectUserApi.getByDeliveryProjectId.mock.calls,
    ).toMatchObject([['123']]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
  });

  it('should render the page when Delivery Programme Admins fail to load correctly', async () => {
    const { mockDeliveryProjectUserApi, renderComponent, mockErrorApi } =
      setup();
    const error = new Error('it broke');
    mockDeliveryProjectUserApi.getByDeliveryProjectId.mockRejectedValueOnce(
      error,
    );

    const rendered = await renderComponent();

    expect(rendered.baseElement).toMatchSnapshot();
    expect(
      mockDeliveryProjectUserApi.getByDeliveryProjectId.mock.calls,
    ).toMatchObject([['123']]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'Error: it broke',
          name: 'Error while getting the list of Delivery Project Users.',
          stack: undefined,
        },
      ],
    ]);
  });
});

function noTableData(value: unknown) {
  if (typeof value !== 'object' || value === null) return value;
  const { tableData, ...result } = value as Record<string, unknown>;
  return result;
}
