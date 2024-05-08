import type { TestDatabaseId } from '@backstage/backend-test-utils';
import { TestDatabases } from '@backstage/backend-test-utils';
import { DeliveryProjectStore } from './deliveryProjectStore';
import { NotFoundError } from '@backstage/errors';
import type {
  CreateDeliveryProjectRequest,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import {
  deliveryProjectSeedData,
  expectedProjectDataWithName,
} from '../testData/projectTestData';
import { albSeedData } from '../testData/albTestData';
import { initializeAdpDatabase } from '../database/initializeAdpDatabase';
import { randomUUID } from 'node:crypto';
import type { arms_length_body } from '../armsLengthBody/arms_length_body';
import { arms_length_body_name } from '../armsLengthBody/arms_length_body';
import type { delivery_programme } from '../deliveryProgramme/delivery_programme';
import { delivery_programme_name } from '../deliveryProgramme/delivery_programme';
import type { delivery_project } from './delivery_project';
import { delivery_project_name } from './delivery_project';
import { deliveryProgrammeSeedData } from '../testData/programmeTestData';
import type { Knex } from 'knex';

describe('DeliveryProjectStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await initializeAdpDatabase({
      getClient: () => Promise.resolve(knex),
    });
    const projectStore = new DeliveryProjectStore(knex);

    return { knex, projectStore };
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

  it.each(databases.eachSupportedId())(
    'should create a new Delivery Project',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      const programmeId = await seedProgramme(knex);

      const expectedProject: CreateDeliveryProjectRequest = {
        ...expectedProjectDataWithName,
        delivery_programme_id: programmeId,
      };

      const addResult = await projectStore.add(expectedProject, 'test');
      if (!addResult.success) throw new Error('Failed to seed project');
      const addedProject = addResult.value;

      expect(addedProject.title).toEqual(expectedProject.title);
      expect(addedProject.id).toBeDefined();
      expect(addedProject.created_at).toBeDefined();
      expect(addedProject.updated_at).toBeDefined();
      expect(addedProject.namespace).toEqual(
        'test-delivery-programme-code-test-title',
      );
    },
  );

  it.each(databases.eachSupportedId())(
    'should get all Delivery Projects from the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      await seedProject(knex);

      const getAllResult = await projectStore.getAll();
      expect(getAllResult).toHaveLength(1);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a Delivery Project from the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      const programmeId = await seedProgramme(knex);
      const expectedProject: CreateDeliveryProjectRequest = {
        ...expectedProjectDataWithName,
        delivery_programme_id: programmeId,
      };
      const createResult = await projectStore.add(expectedProject, 'test');
      if (!createResult.success)
        throw new Error(
          `Failed to seed project: ${JSON.stringify(createResult.errors)}`,
        );
      const createdProject = createResult.value;

      const getResult = await projectStore.get(createdProject.id);

      expect(getResult).toBeDefined();
      expect(getResult?.title).toBe(createdProject.title);
      expect(getResult?.alias).toBe(createdProject.alias);
      expect(getResult?.description).toBe(createdProject.description);
      expect(getResult?.namespace).toBe(createdProject.namespace);
    },
  );

  it.each(databases.eachSupportedId())(
    'should throw NotFound if a Delivery Project cannot be found in the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      await seedProject(knex);

      const getResult = projectStore.get('12345');

      await expect(getResult).rejects.toBeInstanceOf(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing Delivery Project in the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      const currentId = await seedProject(knex);

      const expectedUpdate: UpdateDeliveryProjectRequest = {
        id: currentId,
        title: 'Test title updated',
      };

      const updateResult = await projectStore.update(
        expectedUpdate,
        'test1@test.com',
      );

      expect(updateResult).toBeDefined();
      expect(updateResult).toMatchObject({
        success: true,
        value: {
          title: expectedUpdate.title,
        },
      });
    },
  );

  it.each(databases.eachSupportedId())(
    'should not update a non-existing Delivery Project in the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      await seedProject(knex);

      const expectedUpdate: UpdateDeliveryProjectRequest = {
        id: '12345',
        title: 'Test title updated',
      };

      await expect(
        async () => await projectStore.update(expectedUpdate, 'test1@test.com'),
      ).rejects.toThrow(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should not update an undefined project id',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      await seedProject(knex);

      const expectedUpdate: UpdateDeliveryProjectRequest = {
        id: randomUUID(),
        title: 'Test title updated',
      };

      await expect(
        async () => await projectStore.update(expectedUpdate, 'test1@test.com'),
      ).rejects.toThrow(NotFoundError);
    },
  );

  describe('#getByName', () => {
    it.each(databases.eachSupportedId())(
      'Should get the project when it exists',
      async databaseId => {
        // arrange
        const { knex, projectStore } = await createDatabase(databaseId);
        await seedProject(knex);

        const expected = deliveryProjectSeedData;
        const name = deliveryProjectSeedData.name;

        // act
        const actual = await projectStore.getByName(name);

        // assert
        expect(actual).toMatchObject(expected);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should throw NotFound when the project doesnt exist',
      async databaseId => {
        // arrange
        const { projectStore } = await createDatabase(databaseId);

        // act
        const actual = projectStore.getByName('abc');

        // assert
        await expect(actual).rejects.toBeInstanceOf(NotFoundError);
      },
    );
  });
});
