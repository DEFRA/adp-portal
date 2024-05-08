import type { TestDatabaseId } from '@backstage/backend-test-utils';
import { TestDatabases } from '@backstage/backend-test-utils';
import { DeliveryProgrammeAdminStore } from './deliveryProgrammeAdminStore';
import { initializeAdpDatabase } from '../database';
import type { delivery_programme } from '../deliveryProgramme/delivery_programme';
import { delivery_programme_name } from '../deliveryProgramme/delivery_programme';
import type { delivery_programme_admin } from './delivery_programme_admin';
import { delivery_programme_admin_name } from './delivery_programme_admin';

describe('DeliveryProgrammeAdminStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await initializeAdpDatabase({
      getClient: () => Promise.resolve(knex),
    });
    const deliveryProgrammeAdminStore = new DeliveryProgrammeAdminStore(knex);

    return { knex, deliveryProgrammeAdminStore };
  }

  it.each(databases.eachSupportedId())(
    'should get all Delivery Programme Admins from the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } = await createDatabase(
        databaseId,
      );

      // Arrange - test case setup
      const deliveryProgramme = await knex
        .first('id')
        .from<delivery_programme>(delivery_programme_name);

      await deliveryProgrammeAdminStore.addMany([
        {
          delivery_programme_id: deliveryProgramme.id,
          aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
          email: 'test1.test@onmicrosoft.com',
          name: 'test 1',
        },
        {
          delivery_programme_id: deliveryProgramme.id,
          aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422',
          email: 'test2.test@onmicrosoft.com',
          name: 'test 2',
        },
      ]);

      // Act & assert
      const getAllResult = await deliveryProgrammeAdminStore.getAll();
      expect(getAllResult).toHaveLength(2);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get Delivery Programme Admins by Delivery Programme from the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } = await createDatabase(
        databaseId,
      );

      // Arrange - test case setup
      const deliveryProgrammes = await knex
        .select('id')
        .from<delivery_programme>(delivery_programme_name);

      await deliveryProgrammeAdminStore.addMany([
        {
          delivery_programme_id: deliveryProgrammes[0].id,
          aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73421',
          email: 'test1.test@onmicrosoft.com',
          name: 'test 1',
        },
        {
          delivery_programme_id: deliveryProgrammes[1].id,
          aad_entity_ref_id: 'a9dc2414-0626-43d2-993d-a53aac4d73422',
          email: 'test2.test@onmicrosoft.com',
          name: 'test 2',
        },
      ]);

      // Act and assert
      const getResult =
        await deliveryProgrammeAdminStore.getByDeliveryProgramme(
          deliveryProgrammes[0].id,
        );
      expect(getResult).toHaveLength(1);
      expect(getResult).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: 'test1.test@onmicrosoft.com',
          }),
        ]),
      );
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a Delivery Programme Admin from the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } = await createDatabase(
        databaseId,
      );

      // Arrange - test case setup
      const deliveryProgrammes = await knex
        .select('id')
        .from<delivery_programme>(delivery_programme_name);

      await deliveryProgrammeAdminStore.addMany([
        {
          delivery_programme_id: deliveryProgrammes[0].id,
          aad_entity_ref_id: '888afa93-aaf4-4fec-acca-1b0995ca6eaf',
          email: 'test1.test@onmicrosoft.com',
          name: 'test 1',
        },
        {
          delivery_programme_id: deliveryProgrammes[1].id,
          aad_entity_ref_id: '789d7a1a-998e-40f9-81b4-51a39be02c17',
          email: 'test2.test@onmicrosoft.com',
          name: 'test 2',
        },
      ]);

      // Act and assert
      const getResult = await deliveryProgrammeAdminStore.getByAADEntityRef(
        '888afa93-aaf4-4fec-acca-1b0995ca6eaf',
        deliveryProgrammes[0].id,
      );
      expect(getResult).toBeDefined();
      expect(getResult?.email).toEqual('test1.test@onmicrosoft.com');
    },
  );

  it.each(databases.eachSupportedId())(
    'should insert a single Delivery Programme Admin into the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } = await createDatabase(
        databaseId,
      );

      // Arrange - test case setup
      const deliveryProgramme = await knex
        .first('id')
        .from<delivery_programme>(delivery_programme_name);

      // Act
      const deliveryProgrammeAdmin = {
        delivery_programme_id: deliveryProgramme.id,
        aad_entity_ref_id: '6b55146d-50c3-473c-bfe5-758ee75e55c1',
        email: 'test1.test@onmicrosoft.com',
        name: 'test 1',
      };
      const addResult = await deliveryProgrammeAdminStore.add(
        deliveryProgrammeAdmin,
      );

      const expectedEntity = await knex
        .first('id', 'name')
        .where('id', addResult.id)
        .from<delivery_programme_admin>(delivery_programme_admin_name);

      // Assert - check return value
      expect(addResult).toBeDefined();
      expect(addResult.id).toBeDefined();

      // Assert - check row in DB
      expect(expectedEntity).toBeDefined();
      expect(expectedEntity.id).toBe(addResult.id);
      expect(expectedEntity.name).toBe(deliveryProgrammeAdmin.name);
    },
  );

  it.each(databases.eachSupportedId())(
    'should insert multiple Delivery Programme Admins into the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } = await createDatabase(
        databaseId,
      );

      // Arrange - test case setup
      const deliveryProgramme = await knex
        .first('id')
        .from<delivery_programme>(delivery_programme_name);

      // Act
      const addResult = await deliveryProgrammeAdminStore.addMany([
        {
          delivery_programme_id: deliveryProgramme.id,
          aad_entity_ref_id: '2163f597-25cb-4dc3-a617-9f87d140542c',
          email: 'test1.test@onmicrosoft.com',
          name: 'test 1',
        },
        {
          delivery_programme_id: deliveryProgramme.id,
          aad_entity_ref_id: '47862635-9673-45c4-aa5a-81843d5df9de',
          email: 'test2.test@onmicrosoft.com',
          name: 'test 2',
        },
      ]);

      const expectedEntities = await knex
        .where('delivery_programme_id', deliveryProgramme.id)
        .from<delivery_programme_admin>(delivery_programme_admin_name);

      // Assert - check return value
      expect(addResult).toHaveLength(2);
      expect(expectedEntities).toHaveLength(2);
    },
  );

  it.each(databases.eachSupportedId())(
    'should delete a Delivery Programme Admin from the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } = await createDatabase(
        databaseId,
      );

      // Arrange - test case setup
      const deliveryProgramme = await knex
        .first('id')
        .from<delivery_programme>(delivery_programme_name);

      const deliveryProgrammeAdmin = {
        delivery_programme_id: deliveryProgramme.id,
        aad_entity_ref_id: '43d2bf46-2d30-45e9-b5ca-d5f5e9f3f5e8',
        email: 'test1.test@onmicrosoft.com',
        name: 'test 1',
      };
      const addResult = await deliveryProgrammeAdminStore.add(
        deliveryProgrammeAdmin,
      );

      // Act - delete the record
      await deliveryProgrammeAdminStore.delete(addResult.id);

      const expectedEntities = await knex
        .where('id', addResult.id)
        .from<delivery_programme_admin>(delivery_programme_admin_name);

      // Assert
      expect(expectedEntities).toHaveLength(0);
    },
  );
});
