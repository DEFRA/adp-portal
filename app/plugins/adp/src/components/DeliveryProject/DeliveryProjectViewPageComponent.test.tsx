import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import {
  PermissionApi,
  permissionApiRef,
  usePermission,
} from '@backstage/plugin-permission-react';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { DeliveryProjectViewPageComponent } from './DeliveryProjectViewPageComponent';
import {
  alertApiRef,
  errorApiRef,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

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

jest.mock('../../hooks/useDeliveryProgrammesList', () => ({
  useDeliveryProgrammesList: jest.fn(() => [
    { label: 'Programme1', value: '1' },
    { label: 'Programme2', value: '2' },
  ]),
}));

const mockTableData = [
  {
    id: '1',
    title: 'Delivery Project 1',
    description: 'Description 1',
    delivery_project_code: '1',
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z',
    delivery_programme_id: '1',
  },
];

const updatedTableData = [
  {
    id: '1',
    title: 'Delivery Project 1 updated',
    description: 'Description 1',
    delivery_project_code: '1',
    created_at: '2021-01-01T00:00:00Z',
    updated_at: '2021-01-01T00:00:00Z',
    delivery_programme_id: '1',
  },
];

const mockGetDeliveryProjects = jest.fn();
const mockUpdateDeliveryProject = jest.fn().mockResolvedValue({});
const mockGetDeliveryProjectById = jest.fn().mockResolvedValue({
  id: '1',
  title: 'Delivery Project 1',
  description: 'Description 1',
  delivery_project_code: '1',
  created_at: '2021-01-01T00:00:00Z',
  updated_at: '2021-01-01T00:00:00Z',
  delivery_programme_id: '1',
});
jest.mock('./api/DeliveryProjectClient', () => ({
  DeliveryProjectClient: jest.fn().mockImplementation(() => ({
    getDeliveryProjects: mockGetDeliveryProjects,
    updateDeliveryProject: mockUpdateDeliveryProject,
    getDeliveryProjectById: mockGetDeliveryProjectById,
  })),
}));

describe('DeliveryProjectViewPageComponent', () => {
  beforeEach(() => {
    mockGetDeliveryProjects.mockClear();
    mockUpdateDeliveryProject.mockClear();
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
      <DeliveryProjectViewPageComponent />
    </TestApiProvider>
  );
  const render = async () => renderInTestApp(element);

  afterEach(() => {
    mockGetDeliveryProjects.mockReset();
    jest.clearAllMocks();
  });

  it('fetches and displays delivery projects in the table upon loading', async () => {
    mockGetDeliveryProjects.mockResolvedValue(mockTableData);
    const rendered = await render();

    await waitFor(() => {
      expect(rendered.getByText('Delivery Project 1')).toBeInTheDocument();
    });
  });

  it('should throw error when DeliveryProjectClient throws error', async () => {
    mockGetDeliveryProjects.mockImplementation(() => {
      throw new Error('Cannot fetch Delivery Project');
    });

    const rendered = await render();

    await waitFor(async () => {
      expect(
        await rendered.findByText('Delivery Projects'),
      ).toBeInTheDocument();
      expect(mockErrorApi.post).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Cannot fetch Delivery Project',
        }),
      );
    });
  });

  it('should open edit modal when edit button is clicked', async () => {
    mockGetDeliveryProjects.mockResolvedValue(mockTableData);
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId('delivery-project-edit-button-1'));
    });

    await waitFor(() => {
      expect(
        rendered.getByText('Edit: Delivery Project 1'),
      ).toBeInTheDocument();
    });
  });

  it('should close edit modal when cancel button is clicked', async () => {
    mockGetDeliveryProjects.mockResolvedValue(mockTableData);
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId('delivery-project-edit-button-1'));
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
        rendered.queryByText('Edit: Delivery Project 1'),
      ).not.toBeInTheDocument();
    });
  });

  it('should open add modal when add button is clicked', async () => {
    mockGetDeliveryProjects.mockResolvedValue(mockTableData);
    const rendered = await render();

    fireEvent.click(rendered.getByTestId('create-delivery-project-button'));

    await waitFor(() => {
      expect(rendered.getByText('Create:')).toBeInTheDocument();
    });
  });

  it('should update the item when update button is clicked', async () => {
    mockGetDeliveryProjects.mockResolvedValue(mockTableData);
    const rendered = await render();

    fireEvent.click(rendered.getByTestId('delivery-project-edit-button-1'));

    await waitFor(() => {
      expect(rendered.queryByText('Title')).toBeInTheDocument();
      expect(rendered.queryByText('Delivery Project 1')).toBeInTheDocument();
    });

    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Delivery Project 1 updated' },
    });

    fireEvent.click(rendered.getByTestId('actions-modal-update-button'));

    mockGetDeliveryProjects.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(mockUpdateDeliveryProject).toHaveBeenCalled();
      expect(mockAlertApi.post).toHaveBeenNthCalledWith(1, {
        display: 'transient',
        message: 'Updated',
        severity: 'success',
      });
      expect(
        rendered.queryByText('Edit: Delivery Project 1'),
      ).not.toBeInTheDocument();
      expect(
        rendered.queryByText('Delivery Project 1 updated'),
      ).toBeInTheDocument();
    });
  });

  it('should not update the item when update button is clicked and has a non-unique title', async () => {
    mockGetDeliveryProjects.mockResolvedValue(mockTableData);
    const updatedTableData = [
      {
        id: '1',
        title: 'Delivery Project 1',
        description: 'Description 1',
        delivery_project_code: '1',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-01-01T00:00:00Z',
        delivery_programme_id: '1',
      },
    ];
    mockUpdateDeliveryProject.mockResolvedValue(updatedTableData);
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId('delivery-project-edit-button-1'));
    });
    await waitFor(() => {
      expect(rendered.queryByText('Title')).toBeInTheDocument();
    });
    act(() => {
      fireEvent.change(rendered.getByLabelText('Title'), {
        target: { value: 'Delivery Project 1' },
      });
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-update-button'));
    });
    mockGetDeliveryProjects.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(
        rendered.queryByText('Edit: Delivery Project 1'),
      ).toBeInTheDocument();
      expect(mockAlertApi.post).toHaveBeenCalledTimes(1);
    });
  });

  it('should call ErrorApi when update fails', async () => {
    mockGetDeliveryProjects.mockResolvedValue(mockTableData);
    mockUpdateDeliveryProject.mockRejectedValue(new Error('Update failed'));
    const rendered = await render();
    act(() => {
      fireEvent.click(rendered.getByTestId('delivery-project-edit-button-1'));
    });
    await waitFor(() => {
      expect(rendered.queryByText('Title')).toBeInTheDocument();
    });
    act(() => {
      fireEvent.change(rendered.getByLabelText('Title'), {
        target: { value: 'Delivery Project 1 updated' },
      });
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-update-button'));
    });

    await waitFor(() => {
      expect(mockErrorApi.post).toHaveBeenCalledTimes(1);
    });
  });
});
