import React from 'react';
import { errorApiRef } from '@backstage/core-plugin-api';
import {
  MockErrorApi,
  TestApiProvider,
  renderInTestApp,
} from '@backstage/test-utils';
import { DeliveryProgrammeAdminApi, deliveryProgrammeAdminApiRef } from './api';
import { DeliveryProgrammeAdminViewPage } from './DeliveryProgrammeAdminViewPage';
import { waitFor } from '@testing-library/react';
import { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { faker } from '@faker-js/faker';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';

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
    annotations: {},
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
    const expectedDeliveryProgrammeAdmins = faker.helpers.multiple(
      createDeliveryProgrammeAdmin,
      { count: 5 },
    );
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockResolvedValue(
      expectedDeliveryProgrammeAdmins,
    );

    const rendered = await renderInTestApp(Provider);

    await waitFor(() => {
      for (let i = 0; i < expectedDeliveryProgrammeAdmins.length; i++) {
        const expectedDeliveryProgrammeAdmin =
          expectedDeliveryProgrammeAdmins[i];
        expect(
          rendered.getByText(expectedDeliveryProgrammeAdmin.name),
        ).toBeInTheDocument();
      }
    });
  });

  it('fetches and displays a message if no Delivery Programme Admins are returned', async () => {
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockResolvedValue([]);

    const rendered = await renderInTestApp(Provider);

    await waitFor(() => {
      expect(rendered.getByText('No records to display')).toBeInTheDocument();
    });
  });

  it('returns an error message when the API returns an error', async () => {
    const expectedError = 'Something broke';
    mockDeliveryProgrameAdminApi.getByDeliveryProgrammeId.mockRejectedValue(
      new Error(expectedError),
    );

    await renderInTestApp(Provider);

    await waitFor(() => {
      expect(mockErrorApi.post).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expectedError,
        }),
      );
    });
  });
});
