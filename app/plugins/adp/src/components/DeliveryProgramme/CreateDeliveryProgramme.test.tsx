import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react';
import CreateDeliveryProgramme from './CreateDeliveryProgramme';
import {
  alertApiRef,
  discoveryApiRef,
  errorApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import { catalogApiRef } from '@backstage/plugin-catalog-react';

const mockAlertApi = { post: jest.fn() };
const mockErrorApi = { post: jest.fn() };
const mockDiscoveryApi = { getBaseUrl: jest.fn() };
const mockFetchApi = { fetch: jest.fn() };

const entities = [
  {
    "metadata": {
      "namespace": "default",
      "name": "userone.onmicrosoft.com"
    },
    "spec": {
      "profile": {
        "displayName": "user one"
      }
    }
  },
  {
    "metadata": {
      "namespace": "default",
      "name": "usertwo.onmicrosoft.com"
    },
    "spec": {
      "profile": {
        "displayName": "user two"
      }
    }
  }
];
const mockCatalogApi = {
  getEntities: jest
    .fn()
    .mockImplementation(async () => ({ items: entities })),
};

const mockGetDeliveryProgrammes = jest.fn();
const mockCreateDeliveryProgramme = jest.fn().mockResolvedValue({});
const mockRefetchDeliveryProgramme = jest.fn();
jest.mock('./api/DeliveryProgrammeClient', () => ({
  DeliveryProgrammeClient: jest.fn().mockImplementation(() => ({
    getDeliveryProgrammes: mockGetDeliveryProgrammes,
    createDeliveryProgramme: mockCreateDeliveryProgramme,
  })),
}));

jest.mock('../../utils/transformDeliveryProgrammeManagers', () => ({
  transformDeliveryProgrammeManagers: jest.fn()
}));

describe('Create Delivery Programme', () => {
  const element = (
    <TestApiProvider
      apis={[
        [alertApiRef, mockAlertApi],
        [errorApiRef, mockErrorApi],
        [discoveryApiRef, mockDiscoveryApi],
        [catalogApiRef, mockCatalogApi],
        [fetchApiRef, mockFetchApi]
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
        title: 'Delivery Programme 1',
        description: 'Description for Delivery Programme 1',
        programme_managers: [
          {
            "programme_manager_id": "user:default/test123"
          },
          {
            "programme_manager_id": "user:default/test345"
          },
        ],
        arms_length_body: 'Arms Length Body 1',
        delivery_programme_code: 'Delivery Program Code',
      },
    ];

    const rendered = await render();

    act(() => {
      fireEvent.click(rendered.getByTestId('create-delivery-programme-button'));
    });

    act(() => {
      fireEvent.change(rendered.getByLabelText('Title'), {
        target: { value: 'Delivery Programme 1' },
      });

      fireEvent.change(
        rendered.getByLabelText('Delivery Programme Description'),
        {
          target: { value: 'Description for Delivery Programme 1' },
        },
      );

      fireEvent.change(rendered.getByLabelText('Delivery Programme Code'), {
        target: { value: 'Delivery Programme Code 1' },
      });
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-update-button'));
    });

    mockGetDeliveryProgrammes.mockResolvedValue(updatedTableData);

    await waitFor(() => {
      expect(mockCreateDeliveryProgramme).toHaveBeenCalled();
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

    act(() => {
      fireEvent.click(rendered.getByTestId('create-delivery-programme-button'));
    });

    act(() => {
      fireEvent.change(rendered.getByLabelText('Title'), {
        target: { value: 'Delivery Programme 1' },
      });
      fireEvent.change(
        rendered.getByLabelText('Delivery Programme Description'),
        {
          target: { value: 'Description for Delivery Programme 1' },
        },
      );
    });

    act(() => {
      fireEvent.click(rendered.getByTestId('actions-modal-update-button'));
    });


    await waitFor(() => {
      expect(mockCreateDeliveryProgramme).toHaveBeenCalled();

      expect(mockErrorApi.post).toHaveBeenCalledWith(expect.any(Error));

      expect(mockAlertApi.post).toHaveBeenNthCalledWith(1, {
        display: 'permanent',
        message:
          "The title 'Delivery Programme 1' is already in use. Please choose a different name.",
        severity: 'error',
      });
    });
  });
});
