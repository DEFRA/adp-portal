import React from 'react';
import { errorApiRef } from '@backstage/core-plugin-api';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import type { DeliveryProgrammeAdminApi } from './api';
import { deliveryProgrammeAdminApiRef } from './api';
import { DeliveryProgrammeAdminViewPage } from './DeliveryProgrammeAdminViewPage';
import { waitFor } from '@testing-library/react';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { faker } from '@faker-js/faker';
import {
  EntityProvider,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import type { Entity } from '@backstage/catalog-model';

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

  const apis = [
    [errorApiRef, mockErrorApi],
    [deliveryProgrammeAdminApiRef, mockDeliveryProgrameAdminApi],
  ] as const;

  const Provider = (
    <TestApiProvider apis={apis}>
      <EntityProvider entity={groupEntity}>
        <DeliveryProgrammeAdminViewPage />
      </EntityProvider>
    </TestApiProvider>
  );

  return { mockDeliveryProgrameAdminApi, mockErrorApi, Provider };
}

function createDeliveryProgrammeAdmin(): DeliveryProgrammeAdmin {
  return {
    id: faker.string.uuid(),
    delivery_programme_id: faker.string.uuid(),
    aad_entity_ref_id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    updated_at: faker.date.past(),
  };
}

describe('DeliveryProgrammeAdminViewPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays Delivery Programme Admins in the table upon loading', async () => {
    const { mockDeliveryProgrameAdminApi, Provider } = setup();
    const expectedDeliveryProgrammeAdmins = faker.helpers.multiple(
      createDeliveryProgrammeAdmin,
      { count: 5 },
    );
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockResolvedValue(
      expectedDeliveryProgrammeAdmins,
    );

    const rendered = await renderInTestApp(Provider, {
      mountedRoutes: {
        '/catalog/:namespace/:kind/:name/*': entityRouteRef,
      },
    });

    await waitFor(() => {
      for (const expectedDeliveryProgrammeAdmin of expectedDeliveryProgrammeAdmins) {
        expect(
          rendered.getByText(expectedDeliveryProgrammeAdmin.name),
        ).toBeInTheDocument();
      }
    });
  });

  it('fetches and displays a message if no Delivery Programme Admins are returned', async () => {
    const { mockDeliveryProgrameAdminApi, Provider } = setup();
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockResolvedValue([]);

    const rendered = await renderInTestApp(Provider, {
      mountedRoutes: {
        '/catalog/:namespace/:kind/:name/*': entityRouteRef,
      },
    });

    await waitFor(() => {
      expect(rendered.getByText('No records to display')).toBeInTheDocument();
    });
  });

  it('returns an error message when the API returns an error', async () => {
    const { mockDeliveryProgrameAdminApi, mockErrorApi, Provider } = setup();
    const expectedError = 'Something broke';
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockRejectedValue(
      new Error(expectedError),
    );

    await renderInTestApp(Provider, {
      mountedRoutes: {
        '/catalog/:namespace/:kind/:name/*': entityRouteRef,
      },
    });

    await waitFor(() => {
      expect(mockErrorApi.post).toHaveBeenCalledWith({
        message: `Error: ${expectedError}`,
        name: 'Error while getting the list of delivery programme admins.',
        stack: undefined,
      });
    });
  });
});
