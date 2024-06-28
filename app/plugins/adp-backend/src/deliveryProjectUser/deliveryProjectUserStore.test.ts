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
import type { UpdateDeliveryProjectUserRequest } from '@internal/plugin-adp-common';
import { NotFoundError } from '@backstage/errors';

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

  async function seedProjectUser(knex: Knex): Promise<delivery_project_user> {
    const projectId = await seedProject(knex);
    const projectUser = createDeliveryProjectUserEntity(projectId);
    await knex<delivery_project_user>(delivery_project_user_name).insert(
      projectUser,
    );
    return projectUser;
  }

  it.each(databases.eachSupportedId())(
    'should get all Delivery Project Users from the database',
    async databaseId => {
      const { knex, deliveryProjectUserStore } =
        await createDatabase(databaseId);
      await seedProjectUser(knex);

      const getAllResult = await deliveryProjectUserStore.getAll();
      expect(getAllResult).toHaveLength(1);
    },
  );

  it.each(databases.eachSupportedId())(
    'should create a new Delivery Project User',
    async databaseId => {
      const { knex, deliveryProjectUserStore } =
        await createDatabase(databaseId);
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
      const { knex, deliveryProjectUserStore } =
        await createDatabase(databaseId);
      const projectId = await seedProject(knex);
      const users = faker.helpers.multiple(
        () => createDeliveryProjectUserEntity(projectId),
        { count: 4 },
      );
      await knex<delivery_project>(delivery_project_user_name).insert(users);

      const getAllResult =
        await deliveryProjectUserStore.getByDeliveryProject(projectId);
      expect(getAllResult).toHaveLength(4);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a Delivery Project User from the database',
    async databaseId => {
      const { knex, deliveryProjectUserStore } =
        await createDatabase(databaseId);
      const projectUser = await seedProjectUser(knex);

      const getResult = await deliveryProjectUserStore.get(projectUser.id);
      expect(getResult).toBeDefined();
      expect(getResult.aad_entity_ref_id).toBe(projectUser.aad_entity_ref_id);
      expect(getResult.delivery_project_id).toBe(
        projectUser.delivery_project_id,
      );
      expect(getResult.email).toBe(projectUser.email);
      expect(getResult.github_username).toBe(projectUser.github_username);
      expect(getResult.is_admin).toBe(projectUser.is_admin);
      expect(getResult.is_technical).toBe(projectUser.is_technical);
      expect(getResult.name).toBe(projectUser.name);
    },
  );

  it.each(databases.eachSupportedId())(
    'should throw NotFound if a Delivery Project User cannot be found in the database',
    async databaseId => {
      const { deliveryProjectUserStore } = await createDatabase(databaseId);

      const getResult = deliveryProjectUserStore.get(faker.string.uuid());

      await expect(getResult).rejects.toBeInstanceOf(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should throw NotFound if the delivery project user ID is not a UUID',
    async databaseId => {
      const { deliveryProjectUserStore } = await createDatabase(databaseId);

      const getResult = deliveryProjectUserStore.get('1234');

      await expect(getResult).rejects.toBeInstanceOf(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing Delivery Project User in the database',
    async databaseId => {
      const { knex, deliveryProjectUserStore } =
        await createDatabase(databaseId);
      const projectUser = await seedProjectUser(knex);

      const expectedUpdate: UpdateDeliveryProjectUserRequest = {
        id: projectUser.id,
        is_admin: true,
        is_technical: true,
        github_username: 'test github username',
        delivery_project_id: projectUser.delivery_project_id,
        user_catalog_name: 'user@test.com',
      };

      const updateResult =
        await deliveryProjectUserStore.update(expectedUpdate);

      expect(updateResult).toBeDefined();
      expect(updateResult).toMatchObject({
        success: true,
        value: {
          is_admin: expectedUpdate.is_admin,
          is_technical: expectedUpdate.is_technical,
          github_username: expectedUpdate.github_username,
        },
      });
    },
  );

  it.each(databases.eachSupportedId())(
    'should return an unmodified Delivery Project User if no values have changed',
    async databaseId => {
      const { knex, deliveryProjectUserStore } =
        await createDatabase(databaseId);
      const projectUser = await seedProjectUser(knex);
      const updateUser: UpdateDeliveryProjectUserRequest = {
        ...projectUser,
        is_admin: projectUser.is_admin as boolean,
        is_technical: projectUser.is_technical as boolean,
        user_catalog_name: 'user@test.com',
      };

      const updateResult = await deliveryProjectUserStore.update(updateUser);

      expect(updateResult).toBeDefined();
      expect(updateResult).toMatchObject({
        success: true,
        value: {
          is_admin: projectUser.is_admin,
          is_technical: projectUser.is_technical,
          github_username: projectUser.github_username,
        },
      });
    },
  );

  it.each(databases.eachSupportedId())(
    'should not update a non-existing Delivery Project User in the database',
    async databaseId => {
      const { knex, deliveryProjectUserStore } =
        await createDatabase(databaseId);
      await seedProjectUser(knex);

      const expectedUpdate: UpdateDeliveryProjectUserRequest = {
        id: '12345',
        github_username: 'test github user',
        delivery_project_id: '12345',
        user_catalog_name: 'user@test.com',
      };

      await expect(
        async () => await deliveryProjectUserStore.update(expectedUpdate),
      ).rejects.toThrow(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should delete a Delivery Programme Admin from the database',
    async databaseId => {
      const { deliveryProjectUserStore, knex } =
        await createDatabase(databaseId);
      const projectUser = await seedProjectUser(knex);

      assertUUID(projectUser.id);

      // Act - delete the record
      await deliveryProjectUserStore.delete(projectUser.id);

      const expectedEntities = await knex
        .where('id', projectUser.id)
        .from<delivery_project_user>(delivery_project_user_name);

      // Assert
      expect(expectedEntities).toHaveLength(0);
    },
  );

  it.each(databases.eachSupportedId())(
    'should throw NotFound when deleting if a project user cannot be found',
    async databaseId => {
      const { deliveryProjectUserStore } = await createDatabase(databaseId);
      const projectUserId = faker.string.uuid();

      // Act - delete the record
      await expect(
        deliveryProjectUserStore.delete(projectUserId),
      ).rejects.toThrow(NotFoundError);
    },
  );
});
