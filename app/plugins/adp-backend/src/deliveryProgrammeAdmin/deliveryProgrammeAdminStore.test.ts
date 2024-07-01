import type { TestDatabaseId } from '@backstage/backend-test-utils';
import { TestDatabases } from '@backstage/backend-test-utils';
import { DeliveryProgrammeAdminStore } from './deliveryProgrammeAdminStore';
import { initializeAdpDatabase } from '../database';
import type { delivery_programme } from '../deliveryProgramme/delivery_programme';
import { delivery_programme_name } from '../deliveryProgramme/delivery_programme';
import type { delivery_programme_admin } from './delivery_programme_admin';
import { delivery_programme_admin_name } from './delivery_programme_admin';
import type { arms_length_body } from '../armsLengthBody/arms_length_body';
import { arms_length_body_name } from '../armsLengthBody/arms_length_body';
import { albSeedData } from '../testData/albTestData';
import type { Knex } from 'knex';
import { deliveryProgrammeSeedData } from '../testData/programmeTestData';
import { createDeliveryProgrammeAdmin } from '../testData/programmeAdminTestData';
import { faker } from '@faker-js/faker';
import { assertUUID } from '../service/util';

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

  async function seedAlb(knex: Knex) {
    await knex<arms_length_body>(arms_length_body_name).insert(albSeedData);
    return albSeedData.id;
  }

  async function seedProgramme(knex: Knex) {
    await seedAlb(knex);
    await knex<delivery_programme>(delivery_programme_name).insert(
      deliveryProgrammeSeedData,
    );
    return deliveryProgrammeSeedData.id;
  }

  async function seedProgrammeAdmin(knex: Knex) {
    const programmeId = await seedProgramme(knex);
    const programmeAdmin = createDeliveryProgrammeAdmin(programmeId);
    await knex<delivery_programme_admin>(delivery_programme_admin_name).insert(
      programmeAdmin,
    );
    return programmeAdmin.id;
  }

  it.each(databases.eachSupportedId())(
    'should get all Delivery Programme Admins from the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } =
        await createDatabase(databaseId);
      await seedProgrammeAdmin(knex);

      const getAllResult = await deliveryProgrammeAdminStore.getAll();
      expect(getAllResult).toHaveLength(1);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get Delivery Programme Admins by Delivery Programme from the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } =
        await createDatabase(databaseId);
      const programmeId = await seedProgramme(knex);
      const programmeAdmins = faker.helpers.multiple(
        () => createDeliveryProgrammeAdmin(programmeId),
        { count: 4 },
      );
      await knex<delivery_programme_admin>(
        delivery_programme_admin_name,
      ).insert(programmeAdmins);

      const getResult =
        await deliveryProgrammeAdminStore.getByDeliveryProgramme(programmeId);

      expect(getResult).toHaveLength(4);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a Delivery Programme Admin from the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } =
        await createDatabase(databaseId);
      const programmeId = await seedProgramme(knex);
      const programmeAdmin = createDeliveryProgrammeAdmin(programmeId);
      await knex<delivery_programme_admin>(
        delivery_programme_admin_name,
      ).insert(programmeAdmin);

      const getResult = await deliveryProgrammeAdminStore.getByAADEntityRef(
        programmeAdmin.aad_entity_ref_id,
        programmeId,
      );
      expect(getResult).toBeDefined();
      expect(getResult?.email).toEqual(programmeAdmin.email);
    },
  );

  it.each(databases.eachSupportedId())(
    'should insert a single Delivery Programme Admin into the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } =
        await createDatabase(databaseId);
      const programmeId = await seedProgramme(knex);
      const expectedProgrammeAdmin = createDeliveryProgrammeAdmin(programmeId);
      assertUUID(expectedProgrammeAdmin.delivery_programme_id);

      const addResult = await deliveryProgrammeAdminStore.add({
        ...expectedProgrammeAdmin,
        delivery_programme_id: programmeId,
      });

      if (!addResult.success) {
        throw new Error('Failed to seed project');
      }

      const addedProgrammeAdmin = addResult.value;
      expect(addedProgrammeAdmin.aad_entity_ref_id).toBe(
        expectedProgrammeAdmin.aad_entity_ref_id,
      );
      expect(addedProgrammeAdmin.delivery_programme_id).toBe(
        expectedProgrammeAdmin.delivery_programme_id,
      );
      expect(addedProgrammeAdmin.email).toBe(expectedProgrammeAdmin.email);
      expect(addedProgrammeAdmin.id).toBeDefined();
      expect(addedProgrammeAdmin.name).toBe(expectedProgrammeAdmin.name);
    },
  );

  it.each(databases.eachSupportedId())(
    'should delete a Delivery Programme Admin from the database',
    async databaseId => {
      const { deliveryProgrammeAdminStore, knex } =
        await createDatabase(databaseId);
      const programmeAdminId = await seedProgrammeAdmin(knex);

      assertUUID(programmeAdminId);

      // Act - delete the record
      await deliveryProgrammeAdminStore.delete(programmeAdminId);

      const expectedEntities = await knex
        .where('id', programmeAdminId)
        .from<delivery_programme_admin>(delivery_programme_admin_name);

      // Assert
      expect(expectedEntities).toHaveLength(0);
    },
  );
});
