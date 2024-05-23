import React from 'react';
import { errorApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import type { DeliveryProgrammeAdminApi } from './api';
import { deliveryProgrammeAdminApiRef } from './api';
import { DeliveryProgrammeAdminViewPage } from './DeliveryProgrammeAdminViewPage';
import { waitFor } from '@testing-library/react';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import {
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import type { Entity } from '@backstage/catalog-model';
import type * as AddProgrammeAdminButtonModule from './AddProgrammeAdminButton';
import { Button } from '@material-ui/core';
import { SnapshotFriendlyStylesProvider } from '../../utils';

const AddProgrammeAdminButton: jest.MockedFn<
  (typeof AddProgrammeAdminButtonModule)['AddProgrammeAdminButton']
> = jest.fn();

jest.mock(
  './AddProgrammeAdminButton',
  () =>
    ({
      get AddProgrammeAdminButton() {
        return AddProgrammeAdminButton;
      },
    } satisfies typeof AddProgrammeAdminButtonModule),
);

function setup() {
  const mockDeliveryProgrameAdminApi: jest.Mocked<DeliveryProgrammeAdminApi> = {
    getAll: jest.fn(),
    getByDeliveryProgrammeId: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };
  const mockErrorApi = { post: jest.fn() };

  const groupEntity = {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: 'test-group',
      annotations: {
        'adp.defra.gov.uk/delivery-programme-id': '123',
      },
    },
  } as Entity;

  return {
    mockDeliveryProgrameAdminApi,
    mockErrorApi,
    async renderComponent() {
      const result = await renderInTestApp(
        <TestApiProvider
          apis={[
            [errorApiRef, mockErrorApi],
            [deliveryProgrammeAdminApiRef, mockDeliveryProgrameAdminApi],
          ]}
        >
          <SnapshotFriendlyStylesProvider>
            <EntityProvider entity={groupEntity}>
              <DeliveryProgrammeAdminViewPage />
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
        expect(
          result.getByText('Delivery Programme Admins'),
        ).toBeInTheDocument();
      });

      return result;
    },
  };
}

function createDeliveryProgrammeAdmins(count: number) {
  return [...new Array(count)].map<DeliveryProgrammeAdmin>((_, i) => ({
    aad_entity_ref_id: '123',
    delivery_programme_id: '123',
    email: `test-${i}@test.com`,
    id: i.toString(),
    name: `Delivery Programme Admin ${i}`,
    updated_at: new Date(0),
  }));
}

describe('DeliveryProgrammeAdminViewPage', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0);

    AddProgrammeAdminButton.mockImplementation(({ onCreated, ...props }) => (
      <Button {...props} onClick={onCreated} />
    ));
  });

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore();
    jest.clearAllMocks();
  });

  it('should render the page with Delivery Programme Admins correctly', async () => {
    const { mockDeliveryProgrameAdminApi, renderComponent, mockErrorApi } =
      setup();
    const expectedDeliveryProgrammeAdmins = createDeliveryProgrammeAdmins(5);
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockResolvedValue(
      expectedDeliveryProgrammeAdmins,
    );

    const rendered = await renderComponent();

    expect(rendered.baseElement).toMatchSnapshot();
    expect(
      mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mock.calls,
    ).toMatchObject([['123']]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
  });

  it('should render the page with no Delivery Programme Admins correctly', async () => {
    const { mockDeliveryProgrameAdminApi, renderComponent, mockErrorApi } =
      setup();
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockResolvedValue([]);

    const rendered = await renderComponent();

    expect(rendered.baseElement).toMatchSnapshot();
    expect(
      mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mock.calls,
    ).toMatchObject([['123']]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
  });

  it('should render the page when Delivery Programme Admins fail to load correctly', async () => {
    const { mockDeliveryProgrameAdminApi, renderComponent, mockErrorApi } =
      setup();
    const error = new Error('it broke');
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockRejectedValueOnce(
      error,
    );

    const rendered = await renderComponent();

    expect(rendered.baseElement).toMatchSnapshot();
    expect(
      mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mock.calls,
    ).toMatchObject([['123']]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([
      [
        {
          message: 'Error: it broke',
          name: 'Error while getting the list of delivery programme admins.',
          stack: undefined,
        },
      ],
    ]);
  });

  it('should refresh when a Delivery Programme Admin is created', async () => {
    const { mockDeliveryProgrameAdminApi, renderComponent, mockErrorApi } =
      setup();
    const expectedDeliveryProgrammeAdmins = createDeliveryProgrammeAdmins(1);
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(expectedDeliveryProgrammeAdmins);

    const rendered = await renderComponent();

    expect(rendered.baseElement).toMatchSnapshot('initial load');
    expect(
      mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mock.calls,
    ).toMatchObject([['123']]);
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);

    rendered.getByTestId('delivery-programme-admin-add-button').click();

    await waitFor(() =>
      expect(
        mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mock.calls,
      ).toMatchObject([['123'], ['123']]),
    );

    expect(rendered.baseElement).toMatchSnapshot('after create');
    expect(mockErrorApi.post.mock.calls).toMatchObject([]);
  });
});
