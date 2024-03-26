import React from 'react';
import { fireEvent, waitFor, act, getByRole } from '@testing-library/react';
import CreateDeliveryProgramme from './CreateDeliveryProgramme';
import {
  alertApiRef,
  discoveryApiRef,
  errorApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import {
  PermissionApi,
  permissionApiRef,
} from '@backstage/plugin-permission-react';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import userEvent from '@testing-library/user-event';

const mockAlertApi = { post: jest.fn() };
const mockErrorApi = { post: jest.fn() };
const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };

const mockAuthorize = jest
  .fn()
  .mockImplementation(async () => ({ result: AuthorizeResult.ALLOW }));
const permissionApi: Partial<PermissionApi> = { authorize: mockAuthorize };

jest.mock('@backstage/plugin-permission-react', () => ({
  ...jest.requireActual('@backstage/plugin-permission-react'),
  usePermission: jest.fn().mockReturnValue({ allowed: true }),
}));

const mockGetDeliveryProgrammes = jest.fn();
const mockCreateDeliveryProgramme = jest.fn().mockResolvedValue({});
const mockRefetchDeliveryProgramme = jest.fn();

jest.mock('./api/DeliveryProgrammeClient', () => ({
  DeliveryProgrammeClient: jest.fn().mockImplementation(() => ({
    getDeliveryProgrammes: mockGetDeliveryProgrammes,
    createDeliveryProgramme: mockCreateDeliveryProgramme,
  })),
}));

jest.mock('../../hooks/useArmsLengthBodyList', () => ({
  useArmsLengthBodyList: jest.fn(() => [
    { label: 'Arms Length Body 1', value: 'alb1' },
    { label: 'Arms Length Body 2', value: 'alb2' },
  ]),
}));

jest.mock('../../hooks/useProgrammeManagersList', () => ({
  useProgrammeManagersList: jest.fn(() => [
    { label: 'Jane Doe', value: 'testUserId1' },
  ]),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthorize.mockClear();
});

describe('Create Delivery Programme', () => {
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
      <CreateDeliveryProgramme
        refetchDeliveryProgramme={mockRefetchDeliveryProgramme}
      />
    </TestApiProvider>
  );
  const render = async () => renderInTestApp(element);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    mockGetDeliveryProgrammes.mockReset();
  });

  it('closes the "Add Delivery Programme" modal when cancel button is clicked', async () => {
    const rendered = await render();

    act(() => {
      fireEvent.click(rendered.getByTestId('create-delivery-programme-button'));
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-cancel-button'));
    });

    await waitFor(() => {
      expect(rendered.queryByText('Create:')).not.toBeInTheDocument();
    });
  });

  it('Add Delivery Programme can create a Delivery Programme', async () => {
    const updatedTableData = [
      {
        title: 'Delivery Programme ',
        alias: 'Alias for Delivery Programme',
        arms_length_body_id: 'alb1',
        programme_managers: ['testUserId1'],
        delivery_programme_code: 'Delivery Programme Code',
        description: 'Description for Delivery Programme',
      },
    ];

    const rendered = await render();

    fireEvent.click(rendered.getByTestId('create-delivery-programme-button'));

    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Delivery Programme' },
    });

    fireEvent.change(rendered.getByLabelText('Alias'), {
      target: { value: 'Alias for Delivery Programme' },
    });

    userEvent.click(rendered.getByLabelText('Arms Length Body'));
    await waitFor(() =>
      userEvent.click(rendered.getByText(/Arms Length Body 1/i)),
    );

    userEvent.click(rendered.getByLabelText('Programme Managers'));
    await waitFor(() => userEvent.click(rendered.getByText(/Jane Doe/i)));

    fireEvent.change(rendered.getByLabelText('Delivery Programme Code'), {
      target: { value: 'Delivery Programme Code' },
    });

    fireEvent.change(
      rendered.getByLabelText('Delivery Programme Description'),
      {
        target: { value: 'Description for Delivery Programme' },
      },
    );

    fireEvent.click(rendered.getByTestId('actions-modal-update-button'));

    mockGetDeliveryProgrammes.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(mockCreateDeliveryProgramme).toHaveBeenCalledWith({
        title: 'Delivery Programme',
        alias: 'Alias for Delivery Programme',
        programme_managers: ['testUserId1'],
        arms_length_body_id: 'alb1',
        description: 'Description for Delivery Programme',
        delivery_programme_code: 'Delivery Programme Code',
        url: '',
        finance_code: '',
      });
      expect(mockAlertApi.post).toHaveBeenNthCalledWith(1, {
        display: 'transient',
        message: 'Delivery Programme created successfully.',
        severity: 'success',
      });
    });
  });

  it('Add Delivery Programme Creation fails and triggers error handling', async () => {
    mockCreateDeliveryProgramme.mockRejectedValue(new Error('Creation Failed'));

    const rendered = await render();

    fireEvent.click(rendered.getByTestId('create-delivery-programme-button'));

    fireEvent.change(rendered.getByLabelText('Title'), {
      target: { value: 'Delivery Programme' },
    });

    fireEvent.change(rendered.getByLabelText('Alias'), {
      target: { value: 'Alias for Delivery Programme' },
    });

    userEvent.click(rendered.getByLabelText('Arms Length Body'));
    await waitFor(() =>
      userEvent.click(rendered.getByText(/Arms Length Body 1/i)),
    );

    userEvent.click(rendered.getByLabelText('Programme Managers'));
    await waitFor(() => userEvent.click(rendered.getByText(/Jane Doe/i)));

    fireEvent.change(rendered.getByLabelText('Delivery Programme Code'), {
      target: { value: 'Delivery Programme Code' },
    });

    fireEvent.change(
      rendered.getByLabelText('Delivery Programme Description'),
      {
        target: { value: 'Description for Delivery Programme' },
      },
    );

    fireEvent.click(rendered.getByTestId('actions-modal-update-button'));

    await waitFor(() => {
      expect(mockCreateDeliveryProgramme).toHaveBeenCalledWith({
        title: 'Delivery Programme',
        alias: 'Alias for Delivery Programme',
        programme_managers: ['testUserId1'],
        arms_length_body_id: 'alb1',
        description: 'Description for Delivery Programme',
        delivery_programme_code: 'Delivery Programme Code',
        url: '',
        finance_code: '',
      });
      expect(mockErrorApi.post).toHaveBeenCalledWith(expect.any(Error));

      expect(mockAlertApi.post).toHaveBeenNthCalledWith(1, {
        display: 'permanent',
        message:
          "The title 'Delivery Programme' is already in use. Please choose a different title.",
        severity: 'error',
      });
    });
  });
});
