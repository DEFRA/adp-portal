import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { TestApiProvider } from '@backstage/test-utils';
import { errorApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { UserEntityV1alpha1 } from '@backstage/catalog-model';
import { faker } from '@faker-js/faker';
import { transformedData, useCatalogUsersList } from './useCatalogUsersList';

function setup() {
  const mockErrorApi = { post: jest.fn() };
  const mockCatalogApi = {
    getEntities: jest.fn(),
  };

  const apis = [
    [errorApiRef, mockErrorApi],
    [catalogApiRef, mockCatalogApi],
  ] as const;

  const wrapper = ({ children }: React.PropsWithChildren) => (
    <TestApiProvider apis={apis}>{children}</TestApiProvider>
  );

  return { mockErrorApi, mockCatalogApi, wrapper };
}

function createUserEntity(): UserEntityV1alpha1 {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const name = faker.person.fullName({ firstName, lastName });
  const email = faker.internet.email({ firstName, lastName });
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'User',
    metadata: {
      name: name,
      annotations: {
        ['graph.microsoft.com/user-id']: faker.string.uuid(),
        ['metadata.annotations.microsoft.com/email']: email,
      },
    },
    spec: {
      profile: {
        displayName: name,
        email: email,
      },
    },
  };
}

describe('useCatalogUsersList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and returns catalog user data correctly', async () => {
    const { wrapper, mockCatalogApi, mockErrorApi } = setup();
    const catalogEntities = faker.helpers.multiple(createUserEntity, {
      count: 5,
    });

    mockCatalogApi.getEntities.mockResolvedValue({ items: catalogEntities });

    const { result, waitForNextUpdate } = renderHook(
      () => useCatalogUsersList(),
      { wrapper },
    );

    await waitForNextUpdate();

    expect(mockErrorApi.post).not.toHaveBeenCalled();
    expect(result.current).toHaveLength(catalogEntities.length);
  });
});

describe('transformedData', () => {
  it('should transform Programme.managers into an array of objects with id properties', async () => {
    const mockProgramme = {
      programme_managers: ['123', '456'],
    };

    const result = await transformedData(mockProgramme);

    expect(result).toHaveProperty('programme_managers');
    expect(result.programme_managers).toEqual([
      { aad_entity_ref_id: '123' },
      { aad_entity_ref_id: '456' },
    ]);
  });
});
