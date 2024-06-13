import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { TestApiProvider } from '@backstage/test-utils';
import { errorApiRef } from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import type { UserEntityV1alpha1 } from '@backstage/catalog-model';
import { faker } from '@faker-js/faker';
import { useCatalogUsersLiveSearch } from './useCatalogUsersLiveSearch';

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

  it('fetches and returns callback that returns catalog user data correctly', async () => {
    const { wrapper, mockCatalogApi, mockErrorApi } = setup();
    const catalogEntities = faker.helpers.multiple(createUserEntity, {
      count: 5,
    });

    mockCatalogApi.getEntities.mockResolvedValue({ items: catalogEntities });

    const { result, waitForNextUpdate } = renderHook(
      () => useCatalogUsersLiveSearch(),
      { wrapper },
    );

    await waitForNextUpdate();

    expect(mockErrorApi.post).not.toHaveBeenCalled();
    expect(result.current).toBeInstanceOf(Function);
    await expect(result.current('')).resolves.toHaveLength(
      catalogEntities.length,
    );
  });
});
