import type { IdentityProvider } from '@internal/plugin-credentials-context-backend';
import { DeliveryProgrammeStore } from '../deliveryProgramme';
import { DeliveryProgrammeAdminService } from './DeliveryProgrammeAdminService';
import { DeliveryProgrammeService } from './DeliveryProgrammeService';
import type { FireAndForgetCatalogRefresher } from './fireAndForgetCatalogRefresher';
import type {
  DeliveryProgrammeAdmin,
  CreateDeliveryProgrammeRequest,
  DeliveryProgramme,
  UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';

describe('DeliveryProgrammeService', () => {
  describe('#create', () => {
    it('Should add an admin and refresh when adding the programme succeeds', async () => {
      const { sut, identityProvider, store, admins, catalogRefresher } =
        setup();
      const ref = randomUUID();
      const data: CreateDeliveryProgrammeRequest = {
        arms_length_body_id: randomUUID(),
        delivery_programme_code: randomUUID(),
        description: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        url: randomUUID(),
      };
      const expected: DeliveryProgramme = {
        arms_length_body_id: randomUUID(),
        created_at: new Date(),
        delivery_programme_code: randomUUID(),
        description: randomUUID(),
        id: randomUUID(),
        name: randomUUID(),
        title: randomUUID(),
        updated_at: new Date(),
        alias: randomUUID(),
        delivery_programme_admins: [],
        updated_by: randomUUID(),
        url: randomUUID(),
      };
      identityProvider.getCurrentIdentity.mockResolvedValueOnce({
        ownershipEntityRefs: [],
        userEntityRef: ref,
      });
      store.add.mockResolvedValueOnce({ success: true, value: expected });
      admins.add.mockResolvedValueOnce({ success: true, value: null! });

      const actual = await sut.create(data);

      expect(actual).toEqual({
        success: true,
        value: expected,
      });
      expect(identityProvider.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith(data, ref);
      expect(admins.add).toHaveBeenCalledTimes(1);
      expect(admins.add).toHaveBeenCalledWith(expected.id, ref);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        'location:default/delivery-programmes',
      );
    });
    it('Should not add an admin or refresh when adding the programme fails', async () => {
      const { sut, identityProvider, store, admins, catalogRefresher } =
        setup();
      const ref = randomUUID();
      const data: CreateDeliveryProgrammeRequest = {
        arms_length_body_id: randomUUID(),
        delivery_programme_code: randomUUID(),
        description: randomUUID(),
        title: randomUUID(),
        alias: randomUUID(),
        url: randomUUID(),
      };
      const expected = [
        'unknown',
        'unknownArmsLengthBody',
        'duplicateName',
        'duplicateTitle',
        'duplicateProgrammeCode',
      ] as const;
      identityProvider.getCurrentIdentity.mockResolvedValueOnce({
        ownershipEntityRefs: [],
        userEntityRef: ref,
      });
      store.add.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });
      admins.add.mockResolvedValueOnce({ success: true, value: null! });

      const actual = await sut.create(data);

      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
      expect(identityProvider.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledTimes(1);
      expect(store.add).toHaveBeenCalledWith(data, ref);
      expect(admins.add).toHaveBeenCalledTimes(0);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
    });
  });
  describe('#edit', () => {
    it('Should refresh when editing the programme succeeds', async () => {
      const { sut, identityProvider, store, admins, catalogRefresher } =
        setup();
      const ref = randomUUID();
      const data: UpdateDeliveryProgrammeRequest = {
        id: randomUUID(),
        alias: randomUUID(),
        arms_length_body_id: randomUUID(),
        delivery_programme_code: randomUUID(),
        description: randomUUID(),
        title: randomUUID(),
        url: randomUUID(),
      };
      const expected: DeliveryProgramme = {
        arms_length_body_id: randomUUID(),
        created_at: new Date(),
        delivery_programme_code: randomUUID(),
        description: randomUUID(),
        id: randomUUID(),
        name: randomUUID(),
        title: randomUUID(),
        updated_at: new Date(),
        alias: randomUUID(),
        delivery_programme_admins: [],
        updated_by: randomUUID(),
        url: randomUUID(),
      };
      identityProvider.getCurrentIdentity.mockResolvedValueOnce({
        ownershipEntityRefs: [],
        userEntityRef: ref,
      });
      store.update.mockResolvedValueOnce({ success: true, value: expected });

      const actual = await sut.edit(data);

      expect(actual).toEqual({
        success: true,
        value: expected,
      });
      expect(identityProvider.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledWith(data, ref);
      expect(admins.add).toHaveBeenCalledTimes(0);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(1);
      expect(catalogRefresher.refresh).toHaveBeenCalledWith(
        'location:default/delivery-programmes',
      );
    });
    it('Should not refresh when editing the programme fails', async () => {
      const { sut, identityProvider, store, admins, catalogRefresher } =
        setup();
      const ref = randomUUID();
      const data: UpdateDeliveryProgrammeRequest = {
        id: randomUUID(),
        alias: randomUUID(),
        arms_length_body_id: randomUUID(),
        delivery_programme_code: randomUUID(),
        description: randomUUID(),
        title: randomUUID(),
        url: randomUUID(),
      };
      const expected = [
        'unknown',
        'unknownArmsLengthBody',
        'duplicateTitle',
        'duplicateProgrammeCode',
      ] as const;
      identityProvider.getCurrentIdentity.mockResolvedValueOnce({
        ownershipEntityRefs: [],
        userEntityRef: ref,
      });
      store.update.mockResolvedValueOnce({
        success: false,
        errors: [...expected],
      });

      const actual = await sut.edit(data);

      expect(actual).toEqual({
        success: false,
        errors: expected,
      });
      expect(identityProvider.getCurrentIdentity).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledTimes(1);
      expect(store.update).toHaveBeenCalledWith(data, ref);
      expect(admins.add).toHaveBeenCalledTimes(0);
      expect(catalogRefresher.refresh).toHaveBeenCalledTimes(0);
    });
  });

  describe('#getAll', () => {
    it('Should return all the data from the store', async () => {
      const { sut, store } = setup();
      const expected = [...new Array(10)].map<DeliveryProgramme>(() => ({
        arms_length_body_id: randomUUID(),
        created_at: new Date(),
        delivery_programme_code: randomUUID(),
        description: randomUUID(),
        id: randomUUID(),
        name: randomUUID(),
        title: randomUUID(),
        updated_at: new Date(),
        alias: randomUUID(),
        delivery_programme_admins: [],
        updated_by: randomUUID(),
        url: randomUUID(),
      }));
      store.getAll.mockResolvedValueOnce(expected);

      const actual = await sut.getAll();

      expect(actual).toBe(expected);
      expect(store.getAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('#getById', () => {
    it('Should return the record from the store and enrich it with the programme admins', async () => {
      const { sut, store, admins } = setup();
      const id = randomUUID();
      const expected: DeliveryProgramme = {
        arms_length_body_id: randomUUID(),
        created_at: new Date(),
        delivery_programme_code: randomUUID(),
        description: randomUUID(),
        id: randomUUID(),
        name: randomUUID(),
        title: randomUUID(),
        updated_at: new Date(),
        alias: randomUUID(),
        delivery_programme_admins: [
          ...new Array(10),
        ].map<DeliveryProgrammeAdmin>(() => ({
          aad_entity_ref_id: randomUUID(),
          delivery_programme_id: randomUUID(),
          email: randomUUID(),
          id: randomUUID(),
          name: randomUUID(),
          updated_at: new Date(),
          user_entity_ref: randomUUID(),
        })),
        updated_by: randomUUID(),
        url: randomUUID(),
      };

      const { delivery_programme_admins: _, ...storeResult } = expected;
      store.get.mockResolvedValueOnce(storeResult);
      admins.getByProgrammeId.mockResolvedValueOnce(
        expected.delivery_programme_admins!,
      );

      const actual = await sut.getById(id);

      expect(actual).toEqual(expected);
      expect(store.get).toHaveBeenCalledTimes(1);
      expect(store.get).toHaveBeenCalledWith(id);
      expect(admins.getByProgrammeId).toHaveBeenCalledTimes(1);
      expect(admins.getByProgrammeId).toHaveBeenCalledWith(id);
    });
  });
});

function setup() {
  const store = mockInstance(DeliveryProgrammeStore);
  const admins = mockInstance(DeliveryProgrammeAdminService);
  const catalogRefresher: jest.Mocked<FireAndForgetCatalogRefresher> = {
    refresh: jest.fn(),
  };
  const identityProvider: jest.Mocked<IdentityProvider> = {
    getCurrentIdentity: jest.fn(),
  };

  const sut = new DeliveryProgrammeService({
    admins,
    catalogRefresher,
    identityProvider,
    store,
  });

  return { sut, store, admins, catalogRefresher, identityProvider };
}
