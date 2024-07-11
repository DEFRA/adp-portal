import React from 'react';
import {
  type ConfigApi,
  configApiRef,
  identityApiRef,
  type IdentityApi,
} from '@backstage/core-plugin-api';
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
import type { GroupEntity, UserEntity } from '@backstage/catalog-model';
import { DELIVERY_PROJECT_USER_IS_TECH_MEMBER } from '@internal/plugin-adp-common';

describe('useDeliveryProjects', () => {
  it('Should call the catalog api with the correct values, and then call the presentation api when the user is not an admin', async () => {
    const {
      catalogApi,
      identityApi,
      presentationApi,
      configApi,
      useAsync,
      render,
    } = setup();
    const userRef = randomUUID();
    const adminName = randomUUID();
    const expected = {
      loading: false,
      value: {},
    };
    identityApi.getBackstageIdentity.mockResolvedValueOnce({
      ownershipEntityRefs: [],
      type: 'user',
      userEntityRef: userRef,
    });
    const user: UserEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'User',
      metadata: {
        name: userRef,
      },
      spec: {},
      relations: [],
    };
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
    configApi.getString.mockReturnValueOnce(adminName);
    catalogApi.getEntities.mockResolvedValueOnce({
      items: entities,
    });
    catalogApi.getEntityByRef.mockResolvedValueOnce(user);
    for (const presentation of presentations) {
      presentationApi.forEntity.mockReturnValueOnce({
        promise: Promise.resolve(presentation),
        snapshot: null!,
      });
    }
    useAsync.mockReturnValueOnce(expected);

    const { result } = render();
    expect(result.current).toBe(expected);
    expect(configApi.getString).toHaveBeenCalledWith(
      'rbac.platformAdminsGroup',
    );
    expect(useAsync).toHaveBeenCalledTimes(1);
    expect(useAsync).toHaveBeenCalledWith(expect.any(Function), [
      identityApi,
      catalogApi,
      presentationApi,
      `group:default/${adminName}`,
    ]);
    const actual = (await useAsync.mock.calls[0][0]()) as unknown;
    expect(actual).toEqual({
      catalogEntities: entities,
      entityRefToPresentation: new Map(
        presentations.map(p => [p.entityRef, p]),
      ),
    });
    expect(identityApi.getBackstageIdentity).toHaveBeenCalled();
    expect(catalogApi.getEntityByRef).toHaveBeenCalledWith(userRef);
    expect(catalogApi.getEntities).toHaveBeenCalledWith({
      filter: {
        kind: 'Group',
        'spec.type': 'delivery-project',
        [`relations.${DELIVERY_PROJECT_USER_IS_TECH_MEMBER}`]: userRef,
      },
      fields: ['metadata.name', 'metadata.namespace', 'metadata.title', 'kind'],
    });
    for (const entity of entities)
      expect(presentationApi.forEntity).toHaveBeenCalledWith(entity);
  });
  it('Should call the catalog api with the correct values, and then call the presentation api when the user is an admin', async () => {
    const {
      catalogApi,
      identityApi,
      presentationApi,
      configApi,
      useAsync,
      render,
    } = setup();
    const userRef = randomUUID();
    const adminName = randomUUID();
    const expected = {
      loading: false,
      value: {},
    };
    identityApi.getBackstageIdentity.mockResolvedValueOnce({
      ownershipEntityRefs: [],
      type: 'user',
      userEntityRef: userRef,
    });
    const user: UserEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'User',
      metadata: {
        name: userRef,
      },
      spec: {},
      relations: [
        {
          type: 'memberOf',
          targetRef: `group:default/${adminName}`.toLowerCase(),
        },
      ],
    };
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
    configApi.getString.mockReturnValueOnce(adminName);
    catalogApi.getEntities.mockResolvedValueOnce({
      items: entities,
    });
    catalogApi.getEntityByRef.mockResolvedValueOnce(user);
    for (const presentation of presentations) {
      presentationApi.forEntity.mockReturnValueOnce({
        promise: Promise.resolve(presentation),
        snapshot: null!,
      });
    }
    useAsync.mockReturnValueOnce(expected);

    const { result } = render();
    expect(result.current).toBe(expected);
    expect(configApi.getString).toHaveBeenCalledWith(
      'rbac.platformAdminsGroup',
    );
    expect(useAsync).toHaveBeenCalledTimes(1);
    expect(useAsync).toHaveBeenCalledWith(expect.any(Function), [
      identityApi,
      catalogApi,
      presentationApi,
      `group:default/${adminName}`,
    ]);
    const actual = (await useAsync.mock.calls[0][0]()) as unknown;
    expect(actual).toEqual({
      catalogEntities: entities,
      entityRefToPresentation: new Map(
        presentations.map(p => [p.entityRef, p]),
      ),
    });
    expect(identityApi.getBackstageIdentity).toHaveBeenCalled();
    expect(catalogApi.getEntityByRef).toHaveBeenCalledWith(userRef);
    expect(catalogApi.getEntities).toHaveBeenCalledWith({
      filter: {
        kind: 'Group',
        'spec.type': 'delivery-project',
      },
      fields: ['metadata.name', 'metadata.namespace', 'metadata.title', 'kind'],
    });
    for (const entity of entities)
      expect(presentationApi.forEntity).toHaveBeenCalledWith(entity);
  });
  it('Should return empty when the user cannot be found.', async () => {
    const {
      catalogApi,
      identityApi,
      presentationApi,
      configApi,
      useAsync,
      render,
    } = setup();
    const userRef = randomUUID();
    const adminName = randomUUID();
    const expected = {
      loading: false,
      value: {},
    };
    identityApi.getBackstageIdentity.mockResolvedValueOnce({
      ownershipEntityRefs: [],
      type: 'user',
      userEntityRef: userRef,
    });
    configApi.getString.mockReturnValueOnce(adminName);
    catalogApi.getEntityByRef.mockResolvedValueOnce(undefined);
    useAsync.mockReturnValueOnce(expected);

    const { result } = render();
    expect(result.current).toBe(expected);
    expect(configApi.getString).toHaveBeenCalledWith(
      'rbac.platformAdminsGroup',
    );
    expect(useAsync).toHaveBeenCalledTimes(1);
    expect(useAsync).toHaveBeenCalledWith(expect.any(Function), [
      identityApi,
      catalogApi,
      presentationApi,
      `group:default/${adminName}`,
    ]);
    const actual = (await useAsync.mock.calls[0][0]()) as unknown;
    expect(actual).toEqual({
      catalogEntities: [],
      entityRefToPresentation: new Map(),
    });
    expect(identityApi.getBackstageIdentity).toHaveBeenCalled();
    expect(catalogApi.getEntityByRef).toHaveBeenCalledWith(userRef);
    expect(catalogApi.getEntities).not.toHaveBeenCalled();
    expect(presentationApi.forEntity).not.toHaveBeenCalled();
  });
});

jest.mock('react-use');
const { useAsync } = jest.mocked(reactUseMod);
beforeEach(() => {
  jest.resetAllMocks();
});
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
  const configApi = mockProto<ConfigApi>({
    has: jest.fn(),
    keys: jest.fn(),
    get: jest.fn(),
    getOptional: jest.fn(),
    getConfig: jest.fn(),
    getOptionalConfig: jest.fn(),
    getConfigArray: jest.fn(),
    getOptionalConfigArray: jest.fn(),
    getNumber: jest.fn(),
    getOptionalNumber: jest.fn(),
    getBoolean: jest.fn(),
    getOptionalBoolean: jest.fn(),
    getString: jest.fn(),
    getOptionalString: jest.fn(),
    getStringArray: jest.fn(),
    getOptionalStringArray: jest.fn(),
  });

  const apis = [
    [catalogApiRef, catalogApi],
    [identityApiRef, identityApi],
    [entityPresentationApiRef, presentationApi],
    [configApiRef, configApi],
  ] as const;

  return {
    identityApi,
    catalogApi,
    presentationApi,
    configApi,
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
