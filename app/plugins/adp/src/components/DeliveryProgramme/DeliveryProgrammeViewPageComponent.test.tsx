import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import {
  PermissionApi,
  permissionApiRef,
  usePermission,
} from '@backstage/plugin-permission-react';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { DeliveryProgrammeViewPageComponent } from './DeliveryProgrammeViewPageComponent';
import {
  alertApiRef,
  errorApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { entityRouteRef } from '@backstage/plugin-catalog-react';

const mockErrorApi = { post: jest.fn() };
const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };
const mockAlertApi = { post: jest.fn() };

const mockAuthorize = jest
  .fn()
  .mockImplementation(async () => ({ result: AuthorizeResult.ALLOW }));
const permissionApi: Partial<PermissionApi> = { authorize: mockAuthorize };

jest.mock('@backstage/plugin-permission-react', () => ({
  ...jest.requireActual('@backstage/plugin-permission-react'),
  usePermission: jest.fn().mockReturnValue({ allowed: true }),
}));

jest.mock('../../hooks/useArmsLengthBodyList', () => ({
  useArmsLengthBodyList: jest.fn(() => [
    { label: 'Arms Length Body 1', value: '1' },
    { label: 'Arms Length Body 2', value: '2' },
  ]),
}));

jest.mock('../../hooks/useProgrammeManagersList', () => ({
  useProgrammeManagersList: jest.fn(() => [
    { label: 'Jane Doe', value: 'testUserId1' },
    { label: 'John Doe', value: 'testUserId2' },
  ]),
}));

const mockTableData = [
  {
    id: '1',
    title: 'Delivery Programme 1',
    alias: 'DeliveryProgramme1',
    name: 'delivery-programme-1',
    description: 'Description 1',
    finance_code: '',
    delivery_programme_code: '1',
    url: 'http://deliveryprogramme.com',
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z',
    arms_length_body_id: '1',
    programme_managers: [],
  },
  {
    id: '2',
    title: 'Delivery Programme 2',
    alias: 'DeliveryProgramme2',
    name: 'delivery-programme-2',
    description: 'Description 2',
    finance_code: '',
    delivery_programme_code: '2',
    url: 'http://deliveryprogramme.com',
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z',
    arms_length_body_id: '2',
    programme_managers: [],
  },
];

const updatedTableData = [
  {
    id: '1',
    title: 'Delivery Programme 1 edited',
    alias: 'DeliveryProgramme1',
    name: 'delivery-programme-1',
    programme_managers: [],
    arms_length_body_id: '1',
    finance_code: '',
    delivery_programme_code: '1',
    description: 'Description 1',
    url: 'http://delivery1.com',
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Delivery Programme 2',
    alias: 'DeliveryProgramme2',
    name: 'delivery-programme-2',
    finance_code: '',
    delivery_programme_code: '1',
    programme_managers: [],
    arms_length_body_id: '2',
    description: 'Description 2',
    url: 'http://delivery2.com',
    created_at: '2021-01-02T00:00:00Z',
    updated_at: '2021-01-02T00:00:00Z',
  },
];

const mockGetDeliveryProgrammes = jest.fn();
const mockUpdateDeliveryProgramme = jest.fn().mockResolvedValue({});
const mockGetDeliveryProgrammeById = jest.fn().mockResolvedValue({
  id: '1',
  title: 'Delivery Programme 1',
  alias: 'DeliveryProgramme1',
  description: 'Description 1',
  url: 'http://delivery1.com',
  created_at: '2021-01-01T00:00:00Z',
  updated_at: '2021-01-02T00:00:00Z',
  finance_code: '',
  delivery_programme_code: '1',
  arms_length_body_id: '1',
  programme_managers: [
    {
      id: '1',
      delivery_programme_id: '1',
      aad_entity_ref_id: 'testUserId1',
      email: 'name1@email.com',
      name: 'name1',
    },
  ],
});
jest.mock('./api/DeliveryProgrammeClient', () => ({
  DeliveryProgrammeClient: jest.fn().mockImplementation(() => ({
    getDeliveryProgrammes: mockGetDeliveryProgrammes,
    updateDeliveryProgramme: mockUpdateDeliveryProgramme,
    getDeliveryProgrammeById: mockGetDeliveryProgrammeById,
  })),
}));

describe('DeliveryProgrammeViewPageComponent', () => {
  beforeEach(() => {
    mockGetDeliveryProgrammes.mockClear();
    mockUpdateDeliveryProgramme.mockClear();
    mockAuthorize.mockClear();
    (usePermission as jest.Mock).mockReturnValue({ allowed: true });
  });

  const element = (
    <TestApiProvider
      apis={[
        [alertApiRef, mockAlertApi],
        [errorApiRef, mockErrorApi],
        [discoveryApiRef, mockDiscoveryApi],
        [fetchApiRef, mockFetchApi],
        [permissionApiRef, permissionApi],
      ]}
    >
      <DeliveryProgrammeViewPageComponent />
    </TestApiProvider>
  );
  const render = async () => renderInTestApp(element,
    {
      mountedRoutes: {
        '/catalog/:namespace/:kind/:name/*': entityRouteRef
      }
    }
  );

  afterEach(() => {
    mockGetDeliveryProgrammes.mockReset();
    jest.clearAllMocks();
  });

  it('fetches and displays delivery programmes in the table upon loading', async () => {
    mockGetDeliveryProgrammes.mockResolvedValue(mockTableData);
    const rendered = await render();

    await waitFor(() => {
      expect(rendered.getByText('Delivery Programme 1')).toBeInTheDocument();
      expect(rendered.getByText('Delivery Programme 2')).toBeInTheDocument();
    });
  });

  it('should throw error when DeliveryProgramClient throws error', async () => {
    mockGetDeliveryProgrammes.mockImplementation(() => {
      throw new Error('Cannot fetch Delivery Programme');
    });

    const rendered = await render();

    await waitFor(async () => {
      expect(
        await rendered.findByText('Delivery Programmes'),
      ).toBeInTheDocument();
      expect(mockErrorApi.post).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot fetch Delivery Programme',
        }),
      );
    });
  });

  it('should open edit modal when edit button is clicked', async () => {
    mockGetDeliveryProgrammes.mockResolvedValue(mockTableData);
    const rendered = await render();

    act(() => {
      fireEvent.click(rendered.getByTestId('delivery-programme-edit-button-1'));
    });

    await waitFor(() => {
      expect(
        rendered.getByText('Edit: Delivery Programme 1'),
      ).toBeInTheDocument();
    });
  });

  it('should close edit modal when cancel button is clicked', async () => {
    mockGetDeliveryProgrammes.mockResolvedValue(mockTableData);
    const rendered = await render();

    act(() => {
      fireEvent.click(rendered.getByTestId('delivery-programme-edit-button-1'));
    });

    await waitFor(() => {
      expect(
        rendered.getByTestId('actions-modal-cancel-button'),
      ).toBeInTheDocument();
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-cancel-button'));
    });

    await waitFor(() => {
      expect(
        rendered.queryByText('Edit: Delivery Programme 1'),
      ).not.toBeInTheDocument();
    });
  });

  it('should open add modal when add button is clicked', async () => {
    mockGetDeliveryProgrammes.mockResolvedValue(mockTableData);
    const rendered = await render();

    fireEvent.click(rendered.getByTestId('create-delivery-programme-button'));

    await waitFor(() => {
      expect(rendered.getByText('Create:')).toBeInTheDocument();
    });
  });

  it('should update the item when update button is clicked', async () => {
    mockGetDeliveryProgrammes.mockResolvedValue(mockTableData);
    const rendered = await render();

    fireEvent.click(rendered.getByTestId('delivery-programme-edit-button-1'));

    await waitFor(() => {
      expect(rendered.getByLabelText('Title')).toBeInTheDocument();
      expect(
        rendered.queryByText('Edit: Delivery Programme 1'),
      ).toBeInTheDocument();
    });

    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Delivery Programme 1 edited' },
    });

    fireEvent.click(rendered.getByTestId('actions-modal-update-button'));

    mockGetDeliveryProgrammes.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(mockUpdateDeliveryProgramme).toHaveBeenCalledWith({
        id: '1',
        title: 'Delivery Programme 1 edited',
        alias: 'DeliveryProgramme1',
        finance_code: '',
        delivery_programme_code: '1',
        programme_managers: ['testUserId1'],
        arms_length_body_id: '1',
        description: 'Description 1',
        url: 'http://delivery1.com',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-01-02T00:00:00Z',
      });
      expect(mockAlertApi.post).toHaveBeenNthCalledWith(1, {
        display: 'transient',
        message: 'Updated',
        severity: 'success',
      });
      expect(
        rendered.queryByText('Edit: Delivery Programme 1'),
      ).not.toBeInTheDocument();
      expect(
        rendered.queryByText('Delivery Programme 1 edited'),
      ).toBeInTheDocument();
    });
  });

  it('should not update the item when update button is clicked and has a non-unique title', async () => {
    mockGetDeliveryProgrammes.mockResolvedValue(mockTableData);
    const updatedTableData = [
      {
        id: '1',
        title: 'Delivery Programme 2',
        alias: 'DeliveryProgramme1',
        finance_code: '',
        delivery_programme_code: '1',
        programme_managers: [
          {
            id: '1',
            delivery_programme_id: '1',
            aad_entity_ref_id: 'testUserId1',
            email: 'name1@email.com',
            name: 'name1',
          },
        ],
        arms_length_body_id: '1',
        description: 'Description 1',
        url: 'http://delivery1.com',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-01-02T00:00:00Z',
      },
      {
        id: '2',
        title: 'Delivery Programme 2',
        alias: 'DeliveryProgramme2',
        finance_code: '',
        delivery_programme_code: '1',
        programme_managers: [
          {
            id: '1',
            delivery_programme_id: '1',
            aad_entity_ref_id: 'testUserId1',
            email: 'name1@email.com',
            name: 'name1',
          },
          {
            id: '2',
            delivery_programme_id: '2',
            aad_entity_ref_id: 'testUserId2',
            email: 'name2@email.com',
            name: 'name2',
          },
        ],
        arms_length_body_id: '2',
        description: 'Description 2',
        url: 'http://delivery2.com',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-01-01T00:00:00Z',
      },
    ];
    mockUpdateDeliveryProgramme.mockResolvedValue(updatedTableData);
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId('delivery-programme-edit-button-1'));
    });
    await waitFor(() => {
      expect(rendered.queryByText('Title')).toBeInTheDocument();
    });
    act(() => {
      fireEvent.change(rendered.getByLabelText('Title'), {
        target: { value: 'Delivery Programme 2' },
      });
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-update-button'));
    });
    mockGetDeliveryProgrammes.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(
        rendered.queryByText('Edit: Delivery Programme 1'),
      ).toBeInTheDocument();
      expect(mockAlertApi.post).toHaveBeenCalledTimes(1);
    });
  });

  it('should not update the item when update button is clicked and has a non-unique programme_code', async () => {
    mockGetDeliveryProgrammes.mockResolvedValue(mockTableData);

    const rendered = await render();
    fireEvent.click(rendered.getByTestId('delivery-programme-edit-button-2'));

    await waitFor(() =>
      expect(rendered.getByLabelText('Title')).toBeInTheDocument(),
    );

    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Delivery Programme Updated' },
    });
    fireEvent.change(rendered.getByLabelText('Delivery Programme Code'), {
      target: { value: '2' },
    });

    fireEvent.click(rendered.getByTestId('actions-modal-update-button'));

    await waitFor(() => {
      expect(mockUpdateDeliveryProgramme).not.toHaveBeenCalled();
      expect(mockAlertApi.post).toHaveBeenCalledWith({
        display: 'permanent',
        message: expect.stringContaining(
          'already in use. Please choose a different code',
        ),
        severity: 'error',
      });
    });
  });

  it('should call AlertApi when update fails', async () => {
    mockGetDeliveryProgrammes.mockResolvedValue(mockTableData);
    mockUpdateDeliveryProgramme.mockRejectedValue(new Error('Update failed'));
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId('delivery-programme-edit-button-1'));
    });
    await waitFor(() => {
      expect(rendered.queryByText('Title')).toBeInTheDocument();
    });
    act(() => {
      fireEvent.change(rendered.getByLabelText('Title'), {
        target: { value: 'Delivery Programme 2' },
      });
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-update-button'));
    });
    mockGetDeliveryProgrammes.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(mockAlertApi.post).toHaveBeenCalledTimes(1);
    });
  });
});
