import React from 'react';
import { identityApiRef, type IdentityApi } from '@backstage/core-plugin-api';
import {
  type CatalogApi,
  catalogApiRef,
  type EntityPresentationApi,
  entityPresentationApiRef,
  type EntityRefPresentationSnapshot,
} from '@backstage/plugin-catalog-react';
import { TestApiProvider } from '@backstage/test-utils';
import { renderHook } from '@testing-library/react';
import * as reactUseMod from 'react-use';
import { useDeliveryProjects } from './useDeliveryProjects';
import { randomUUID } from 'node:crypto';
import type { GroupEntity } from '@backstage/catalog-model';

describe('useDeliveryProjects', () => {
  it('Should call the catalog api with the correct values, and then call the presentation api', async () => {
    const { catalogApi, identityApi, presentationApi, useAsync, render } =
      setup();
    const userRef = randomUUID();
    const expected = {
      loading: false,
      value: {},
    };
    identityApi.getBackstageIdentity.mockResolvedValueOnce({
      ownershipEntityRefs: [],
      type: 'user',
      userEntityRef: userRef,
    });
    const entities = [...new Array(10)].map<GroupEntity>((_, i) => ({
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Group',
      metadata: {
        name: `group-${i}`,
      },
      spec: {
        children: [],
        type: 'delivery-project',
      },
    }));
    const presentations = entities.map<EntityRefPresentationSnapshot>(
      (_, i) => ({
        entityRef: `group:default/group-${i}`,
        primaryTitle: `Group ${i}`,
      }),
    );
    catalogApi.getEntities.mockResolvedValueOnce({
      items: entities,
    });
    for (const presentation of presentations) {
      presentationApi.forEntity.mockReturnValueOnce({
        promise: Promise.resolve(presentation),
        snapshot: null!,
      });
    }
    useAsync.mockReturnValueOnce(expected);

    const { result } = render();
    expect(result.current).toBe(expected);
    expect(useAsync).toHaveBeenCalledTimes(1);
    expect(useAsync).toHaveBeenCalledWith(expect.any(Function), [
      identityApi,
      catalogApi,
      presentationApi,
    ]);
    const actual = (await useAsync.mock.calls[0][0]()) as unknown;
    expect(actual).toEqual({
      catalogEntities: entities,
      entityRefToPresentation: new Map(
        presentations.map(p => [p.entityRef, p]),
      ),
    });
    expect(identityApi.getBackstageIdentity).toHaveBeenCalled();
    expect(catalogApi.getEntities).toHaveBeenCalledWith({
      filter: {
        kind: 'Group',
        'spec.type': 'delivery-project',
        'relations.hasMember': userRef,
      },
      fields: ['metadata.name', 'metadata.namespace', 'metadata.title', 'kind'],
    });
    for (const entity of entities)
      expect(presentationApi.forEntity).toHaveBeenCalledWith(entity);
  });
});

jest.mock('react-use');
const { useAsync } = jest.mocked(reactUseMod);
function setup() {
  const identityApi = mockProto<IdentityApi>({
    getBackstageIdentity: jest.fn(),
    getCredentials: jest.fn(),
    getProfileInfo: jest.fn(),
    signOut: jest.fn(),
  });
  const catalogApi = mockProto<CatalogApi>({
    addLocation: jest.fn(),
    getEntities: jest.fn(),
    getEntitiesByRefs: jest.fn(),
    getEntityAncestors: jest.fn(),
    getEntityByRef: jest.fn(),
    getEntityFacets: jest.fn(),
    getLocationByEntity: jest.fn(),
    getLocationById: jest.fn(),
    getLocationByRef: jest.fn(),
    queryEntities: jest.fn(),
    refreshEntity: jest.fn(),
    removeEntityByUid: jest.fn(),
    removeLocationById: jest.fn(),
    validateEntity: jest.fn(),
  });
  const presentationApi = mockProto<EntityPresentationApi>({
    forEntity: jest.fn(),
  });

  const apis = [
    [catalogApiRef, catalogApi],
    [identityApiRef, identityApi],
    [entityPresentationApiRef, presentationApi],
  ] as const;

  return {
    identityApi,
    catalogApi,
    presentationApi,
    useAsync,
    render() {
      return renderHook(() => useDeliveryProjects(), {
        wrapper: ({ children }) => (
          <TestApiProvider apis={apis}>{children}</TestApiProvider>
        ),
      });
    },
  };
}
