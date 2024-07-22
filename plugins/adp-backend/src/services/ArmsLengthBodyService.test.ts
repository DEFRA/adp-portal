import { mockServices } from '@backstage/backend-test-utils';
import { ArmsLengthBodyStore } from '../armsLengthBody';
import type { IdentityProvider } from '@internal/plugin-credentials-context-backend';
import type { FireAndForgetCatalogRefresher } from './fireAndForgetCatalogRefresher';
import { ArmsLengthBodyService } from './ArmsLengthBodyService';
import type {
  ArmsLengthBody,
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';

describe('ArmsLengthBodyService', () => {
  describe('#create', () => {
    it('Should add the new alb to the store and refresh the catalog on success', async () => {
      // arrange
      const { sut, store, identity, catalog } = setup();
      const data: CreateArmsLengthBodyRequest = {
        description: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        url: randomUUID(),
      };
      const expected = fakeAlb();
      store.add.mockResolvedValueOnce({ success: true, value: expected });
      identity.getCurrentIdentity.mockResolvedValueOnce({
        userEntityRef: 'test-user-1',
        ownershipEntityRefs: [],
      });
      catalog.refresh.mockResolvedValueOnce();

      // act
      const actual = await sut.create(data);

      // assert
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith(
        data,
        'test-user-1',
        'test-programme-admin-group',
      );
      expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(catalog.refresh).toHaveBeenCalledTimes(1);
      expect(catalog.refresh).toHaveBeenCalledWith(
        'location:default/arms-length-bodies',
      );
      expect(actual).toEqual({
        success: true,
        value: expected,
      });
    });

    it('Should not refresh the catalog if the add fails', async () => {
      // arrange
      const { sut, store, identity, catalog } = setup();
      const data: CreateArmsLengthBodyRequest = {
        description: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        url: randomUUID(),
      };
      const expected = ['duplicateTitle', 'duplicateName', 'unknown'] as const;
      store.add.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });
      identity.getCurrentIdentity.mockResolvedValueOnce({
        userEntityRef: 'test-user-1',
        ownershipEntityRefs: [],
      });
      catalog.refresh.mockResolvedValueOnce();

      // act
      const actual = await sut.create(data);

      // assert
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith(
        data,
        'test-user-1',
        'test-programme-admin-group',
      );
      expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(catalog.refresh).toHaveBeenCalledTimes(0);
      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
    });
  });
  describe('#update', () => {
    it('Should add the new alb to the store and refresh the catalog on success', async () => {
      // arrange
      const { sut, store, identity, catalog } = setup();
      const name = 'my-cool-alb';
      const data: UpdateArmsLengthBodyRequest = {
        id: randomUUID(),
        description: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        url: randomUUID(),
      };
      const expected = fakeAlb({ name });
      store.update.mockResolvedValueOnce({ success: true, value: expected });
      identity.getCurrentIdentity.mockResolvedValueOnce({
        userEntityRef: 'test-user-1',
        ownershipEntityRefs: [],
      });
      catalog.refresh.mockResolvedValueOnce();

      // act
      const actual = await sut.update(data);

      // assert
      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledWith(data, 'test-user-1');
      expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(catalog.refresh).toHaveBeenCalledTimes(1);
      expect(catalog.refresh).toHaveBeenCalledWith(
        'location:default/arms-length-bodies',
      );
      expect(actual).toEqual({
        success: true,
        value: expected,
      });
    });

    it('Should not refresh the catalog if the add fails', async () => {
      // arrange
      const { sut, store, identity, catalog } = setup();
      const data: UpdateArmsLengthBodyRequest = {
        id: randomUUID(),
        description: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        url: randomUUID(),
      };
      const expected = ['duplicateTitle', 'unknown'] as const;
      store.update.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });
      identity.getCurrentIdentity.mockResolvedValueOnce({
        userEntityRef: 'test-user-1',
        ownershipEntityRefs: [],
      });
      catalog.refresh.mockResolvedValueOnce();

      // act
      const actual = await sut.update(data);

      // assert
      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledWith(data, 'test-user-1');
      expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(catalog.refresh).toHaveBeenCalledTimes(0);
      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
    });
  });
  describe('#getById', () => {
    it('Should get the entity from the store', async () => {
      // arrange
      const { sut, store } = setup();
      const expected = fakeAlb();
      const id = randomUUID();
      store.get.mockResolvedValueOnce(expected);

      // act
      const actual = await sut.getById(id);

      // assert
      expect(store.get).toHaveBeenCalledTimes(1);
      expect(store.get).toHaveBeenCalledWith(id);
      expect(actual).toEqual(expected);
    });
  });
  describe('#getAll', () => {
    it('Should get the entities from the store', async () => {
      // arrange
      const { sut, store } = setup();
      const expected = [fakeAlb(), fakeAlb(), fakeAlb()];
      store.getAll.mockResolvedValueOnce(expected);

      // act
      const actual = await sut.getAll();

      // assert
      expect(store.getAll).toHaveBeenCalledTimes(1);
      expect(actual).toEqual(expected);
    });
  });
  describe('#getIdNameMap', () => {
    it('Should build the mapping from the store', async () => {
      // arrange
      const { sut, store } = setup();
      const entities = [fakeAlb(), fakeAlb(), fakeAlb()];
      store.getAll.mockResolvedValueOnce(entities);
      const expected = {
        [entities[0].id]: entities[0].name,
        [entities[1].id]: entities[1].name,
        [entities[2].id]: entities[2].name,
      };

      // act
      const actual = await sut.getIdNameMap();

      // assert
      expect(store.getAll).toHaveBeenCalledTimes(1);
      expect(actual).toEqual(expected);
    });
  });
});

function setup() {
  const store = mockInstance(ArmsLengthBodyStore);

  const config = mockServices.rootConfig({
    data: {
      rbac: {
        programmeAdminGroup: 'test-programme-admin-group',
      },
    },
  });

  const identity: jest.Mocked<IdentityProvider> = {
    getCurrentIdentity: jest.fn(),
  };

  const catalog: jest.Mocked<FireAndForgetCatalogRefresher> = {
    refresh: jest.fn(),
  };

  const sut = new ArmsLengthBodyService({
    armsLengthBodyStore: store,
    catalogRefresher: catalog,
    config: config,
    identityProvider: identity,
  });

  return { sut, catalog, identity, config, store };
}

function fakeAlb(values?: Partial<ArmsLengthBody>): ArmsLengthBody {
  return {
    created_at: new Date(),
    creator: randomUUID(),
    description: randomUUID(),
    id: randomUUID(),
    name: randomUUID(),
    owner: randomUUID(),
    title: randomUUID(),
    updated_at: new Date(),
    alias: randomUUID(),
    updated_by: randomUUID(),
    url: randomUUID(),
    ...values,
  };
}
