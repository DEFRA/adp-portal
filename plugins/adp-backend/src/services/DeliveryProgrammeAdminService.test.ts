import {
  MICROSOFT_EMAIL_ANNOTATION,
  MICROSOFT_GRAPH_USER_ID_ANNOTATION,
} from '@backstage/plugin-catalog-backend-module-msgraph';
import { DeliveryProgrammeAdminStore } from '../deliveryProgrammeAdmin';
import { CatalogUserEntityProvider } from './CatalogUserEntityProvider';
import { DeliveryProgrammeAdminService } from './DeliveryProgrammeAdminService';
import type { FireAndForgetCatalogRefresher } from './fireAndForgetCatalogRefresher';
import { randomUUID } from 'node:crypto';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';

describe('DeliveryProgrammeAdminService', () => {
  describe('#add', () => {
    it('Should add the new admin to the store and refresh the catalog on success', async () => {
      // arrange
      const { sut, catalogRefresher, store, userEntities } = setup();
      const programmeId = randomUUID();
      const userRef = randomUUID();
      const userId = randomUUID();
      const userEmail = randomUUID();
      const userDisplay = randomUUID();
      const expected = fakeAdmin();

      store.add.mockResolvedValueOnce({ success: true, value: expected });
      userEntities.getByEntityRef.mockResolvedValueOnce({
        apiVersion: 'backstage.io/v1beta1',
        kind: 'User',
        metadata: {
          name: randomUUID(),
          annotations: {
            [MICROSOFT_EMAIL_ANNOTATION]: userEmail,
            [MICROSOFT_GRAPH_USER_ID_ANNOTATION]: userId,
          },
        },
        spec: {
          profile: {
            displayName: userDisplay,
          },
        },
      });

      // act
      const actual = await sut.add(programmeId, userRef);

      // assert
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith({
        name: userDisplay,
        email: userEmail,
        aad_entity_ref_id: userId,
        delivery_programme_id: programmeId,
        user_entity_ref: userRef,
      });
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(1);
      expect(userEntities.getByEntityRef).toHaveBeenCalledWith(userRef);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        `location:default/delivery-programmes`,
      );
      expect(actual).toEqual({
        success: true,
        value: expected,
      });
    });
    it('Should not add the admin or refresh if the user cannot be found', async () => {
      // arrange
      const { sut, catalogRefresher, store, userEntities } = setup();
      const programmeId = randomUUID();
      const userRef = randomUUID();

      userEntities.getByEntityRef.mockResolvedValueOnce(undefined);

      // act
      const actual = await sut.add(programmeId, userRef);

      // assert
      expect(store.add).toHaveBeenCalledTimes(0);
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(1);
      expect(userEntities.getByEntityRef).toHaveBeenCalledWith(userRef);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
      expect(actual).toEqual({
        success: false,
        errors: ['unknownCatalogUser'],
      });
    });
    it('Should not refresh if the add fails', async () => {
      // arrange
      const { sut, catalogRefresher, store, userEntities } = setup();
      const programmeId = randomUUID();
      const userRef = randomUUID();
      const userId = randomUUID();
      const userEmail = randomUUID();
      const userDisplay = randomUUID();
      const expected = ['duplicateUser', 'unknownDeliveryProgramme'] as const;

      store.add.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });
      userEntities.getByEntityRef.mockResolvedValueOnce({
        apiVersion: 'backstage.io/v1beta1',
        kind: 'User',
        metadata: {
          name: randomUUID(),
          annotations: {
            [MICROSOFT_EMAIL_ANNOTATION]: userEmail,
            [MICROSOFT_GRAPH_USER_ID_ANNOTATION]: userId,
          },
        },
        spec: {
          profile: {
            displayName: userDisplay,
          },
        },
      });

      // act
      const actual = await sut.add(programmeId, userRef);

      // assert
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith({
        name: userDisplay,
        email: userEmail,
        aad_entity_ref_id: userId,
        delivery_programme_id: programmeId,
        user_entity_ref: userRef,
      });
      expect(userEntities.getByEntityRef).toHaveBeenCalledTimes(1);
      expect(userEntities.getByEntityRef).toHaveBeenCalledWith(userRef);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
    });
  });
  describe('#remove', () => {
    it('Should remove the admin from the store and refresh', async () => {
      // arrange
      const { sut, store, catalogRefresher } = setup();
      const adminId = randomUUID();

      store.delete.mockResolvedValueOnce(true);

      // act
      await sut.remove(adminId);

      // assert
      expect(store.delete).toHaveBeenCalledTimes(1);
      expect(store.delete).toHaveBeenCalledWith(adminId);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        `location:default/delivery-programmes`,
      );
    });
    it('Should not refresh if the remove failed', async () => {
      // arrange
      const { sut, store, catalogRefresher } = setup();
      const adminId = randomUUID();

      store.delete.mockResolvedValueOnce(false);

      // act
      await sut.remove(adminId);

      // assert
      expect(store.delete).toHaveBeenCalledTimes(1);
      expect(store.delete).toHaveBeenCalledWith(adminId);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
    });
  });

  describe('#getByDeliveryProgramme', () => {
    it('Should get all the admins for a programme', async () => {
      // arrange
      const { sut, store } = setup();
      const expected = [fakeAdmin(), fakeAdmin(), fakeAdmin()];
      const id = randomUUID();
      store.getByDeliveryProgramme.mockResolvedValueOnce(expected);

      // act
      const actual = await sut.getByProgrammeId(id);

      // assert
      expect(store.getByDeliveryProgramme).toHaveBeenCalledTimes(1);
      expect(store.getByDeliveryProgramme).toHaveBeenCalledWith(id);
      expect(actual).toEqual(expected);
    });
  });
  describe('#getAll', () => {
    it('Should get the entities from the store', async () => {
      // arrange
      const { sut, store } = setup();
      const expected = [fakeAdmin(), fakeAdmin(), fakeAdmin()];
      store.getAll.mockResolvedValueOnce(expected);

      // act
      const actual = await sut.getAll();

      // assert
      expect(store.getAll).toHaveBeenCalledTimes(1);
      expect(actual).toEqual(expected);
    });
  });
});

function setup() {
  const store = mockInstance(DeliveryProgrammeAdminStore);
  const userEntities = mockInstance(CatalogUserEntityProvider);
  const catalogRefresher: jest.Mocked<FireAndForgetCatalogRefresher> = {
    refresh: jest.fn(),
  };

  const sut = new DeliveryProgrammeAdminService({
    store,
    userEntities,
    catalogRefresher,
  });

  return { sut, store, userEntities, catalogRefresher };
}

function fakeAdmin(
  values?: Partial<DeliveryProgrammeAdmin>,
): DeliveryProgrammeAdmin {
  return {
    aad_entity_ref_id: randomUUID(),
    delivery_programme_id: randomUUID(),
    email: randomUUID(),
    id: randomUUID(),
    name: randomUUID(),
    updated_at: new Date(),
    user_entity_ref: randomUUID(),
    ...values,
  };
}
