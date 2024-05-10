import type { TestDatabaseId } from '@backstage/backend-test-utils';
import { TestDatabases } from '@backstage/backend-test-utils';
import { initializeAdpDatabase } from '../database';
import { DeliveryProjectUserStore } from './deliveryProjectUserStore';
import type { Knex } from 'knex';
import type { arms_length_body } from '../armsLengthBody/arms_length_body';
import { arms_length_body_name } from '../armsLengthBody/arms_length_body';
import { albSeedData } from '../testData/albTestData';
import type { delivery_programme } from '../deliveryProgramme/delivery_programme';
import { delivery_programme_name } from '../deliveryProgramme/delivery_programme';
import { deliveryProgrammeSeedData } from '../testData/programmeTestData';
import type { delivery_project } from '../deliveryProject/delivery_project';
import { delivery_project_name } from '../deliveryProject/delivery_project';
import { deliveryProjectSeedData } from '../testData/projectTestData';
import type { delivery_project_user } from './delivery_project_user';
import { delivery_project_user_name } from './delivery_project_user';
import {
  createDeliveryProjectUser,
  createDeliveryProjectUserEntity,
} from '../testData/projectUserTestData';
import { faker } from '@faker-js/faker';
import { assertUUID } from '../service/util';

describe('DeliveryProjectUserStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await initializeAdpDatabase({
      getClient: () => Promise.resolve(knex),
    });
    const deliveryProjectUserStore = new DeliveryProjectUserStore(knex);

    return { knex, deliveryProjectUserStore };
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

  async function seedProject(knex: Knex) {
    await seedProgramme(knex);
    await knex<delivery_project>(delivery_project_name).insert(
      deliveryProjectSeedData,
    );
    return deliveryProjectSeedData.id;
  }

  async function seedProjectUser(knex: Knex) {
    const projectId = await seedProject(knex);
    const projectUser = createDeliveryProjectUserEntity(projectId);
    await knex<delivery_project_user>(delivery_project_user_name).insert(
      projectUser,
    );
    return projectUser.id;
  }

  it.each(databases.eachSupportedId())(
    'should get all Delivery Project Users from the database',
    async databaseId => {
      const { knex, deliveryProjectUserStore } = await createDatabase(
        databaseId,
      );
      await seedProjectUser(knex);

      const getAllResult = await deliveryProjectUserStore.getAll();
      expect(getAllResult).toHaveLength(1);
    },
  );

  it.each(databases.eachSupportedId())(
    'should create a new Delivery Project User',
    async databaseId => {
      const { knex, deliveryProjectUserStore } = await createDatabase(
        databaseId,
      );
      const projectId = await seedProject(knex);
      const expectedUser = createDeliveryProjectUser(projectId);
      assertUUID(expectedUser.delivery_project_id);

      const addResult = await deliveryProjectUserStore.add({
        ...expectedUser,
        delivery_project_id: expectedUser.delivery_project_id,
      });

      if (!addResult.success) {
        throw new Error('Failed to seed project');
      }

      const addedProjectUser = addResult.value;

      expect(addedProjectUser.aad_entity_ref_id).toEqual(
        expectedUser.aad_entity_ref_id,
      );
      expect(addedProjectUser.delivery_project_id).toEqual(
        expectedUser.delivery_project_id,
      );
      expect(addedProjectUser.email).toEqual(expectedUser.email);
      expect(addedProjectUser.github_username).toEqual(
        expectedUser.github_username,
      );
      expect(addedProjectUser.id).toBeDefined();
      expect(addedProjectUser.is_admin).toEqual(expectedUser.is_admin);
      expect(addedProjectUser.is_technical).toEqual(expectedUser.is_technical);
      expect(addedProjectUser.name).toEqual(expectedUser.name);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get Delivery Project Users by Delivery Project ID',
    async databaseId => {
      const { knex, deliveryProjectUserStore } = await createDatabase(
        databaseId,
      );
      const projectId = await seedProject(knex);
      const users = faker.helpers.multiple(
        () => createDeliveryProjectUserEntity(projectId),
        { count: 4 },
      );
      await knex<delivery_project>(delivery_project_user_name).insert(users);

      const getAllResult = await deliveryProjectUserStore.getByDeliveryProject(
        projectId,
      );
      expect(getAllResult).toHaveLength(4);
    },
  );
});
