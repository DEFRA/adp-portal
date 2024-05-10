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
import { faker } from '@faker-js/faker';
import { waitFor } from '@testing-library/react';

function setup() {
  const mockDeliveryProjectUserApi: jest.Mocked<DeliveryProjectUserApi> = {
    getAll: jest.fn(),
    getByDeliveryProjectId: jest.fn(),
    create: jest.fn(),
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

  const apis = [
    [errorApiRef, mockErrorApi],
    [deliveryProjectUserApiRef, mockDeliveryProjectUserApi],
  ] as const;

  const Provider = (
    <TestApiProvider apis={apis}>
      <EntityProvider entity={groupEntity}>
        <DeliveryProjectUserViewPage />
      </EntityProvider>
    </TestApiProvider>
  );

  return {
    mockDeliveryProjectUserApi,
    mockErrorApi,
    Provider,
  };
}

function createDeliveryProjectUser(): DeliveryProjectUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    aad_entity_ref_id: faker.string.uuid(),
    delivery_project_id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName }),
    id: faker.string.uuid(),
    is_admin: faker.datatype.boolean(),
    is_technical: faker.datatype.boolean(),
    name: faker.person.fullName({ firstName, lastName }),
    updated_at: faker.date.past(),
    github_username: faker.internet.userName({ firstName, lastName }),
  };
}

describe('DeliveryProjectUserViewPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and displays Delivery Project Users in the table upon loading', async () => {
    const { mockDeliveryProjectUserApi, Provider } = setup();
    const expectedDeliveryProjectUsers = faker.helpers.multiple(
      createDeliveryProjectUser,
      { count: 5 },
    );
    mockDeliveryProjectUserApi.getByDeliveryProjectId.mockResolvedValue(
      expectedDeliveryProjectUsers,
    );

    const rendered = await renderInTestApp(Provider, {
      mountedRoutes: {
        '/catalog/:namespace/:kind/:name/*': entityRouteRef,
      },
    });

    await waitFor(() => {
      for (const expectedDeliveryProjectUser of expectedDeliveryProjectUsers) {
        expect(
          rendered.getByText(expectedDeliveryProjectUser.name),
        ).toBeInTheDocument();
      }
    });
  });

  it('fetches and displays a message if no Delivery Project Users are returned', async () => {
    const { mockDeliveryProjectUserApi, Provider } = setup();
    mockDeliveryProjectUserApi.getByDeliveryProjectId.mockResolvedValue([]);

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
    const { mockDeliveryProjectUserApi, mockErrorApi, Provider } = setup();
    const expectedError = 'Something broke';
    mockDeliveryProjectUserApi.getByDeliveryProjectId.mockRejectedValue(
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
        name: 'Error while getting the list of Delivery Project Users.',
        stack: undefined,
      });
    });
  });
});
