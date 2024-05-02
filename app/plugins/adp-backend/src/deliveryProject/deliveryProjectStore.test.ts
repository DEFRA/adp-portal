import { TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';
import { DeliveryProjectStore } from './deliveryProjectStore';
import { NotFoundError } from '@backstage/errors';
import {
  CreateDeliveryProjectRequest,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { expectedProjectDataWithName } from '../testData/projectTestData';
import { expectedProgrammeDataWithoutManager } from '../testData/programmeTestData';
import { expectedAlbWithName } from '../testData/albTestData';
import { initializeAdpDatabase } from '../database/initializeAdpDatabase';
import { randomUUID } from 'node:crypto';

describe('DeliveryProjectStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await initializeAdpDatabase({
      getClient: () => Promise.resolve(knex),
    });
    const projectStore = new DeliveryProjectStore(knex);

    return { knex, projectStore: projectStore };
  }

  it.each(databases.eachSupportedId())(
    'should create a new Delivery Project',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);

      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const programme = {
        ...expectedProgrammeDataWithoutManager,
        arms_length_body_id: albId,
      };
      const insertProgrammeId = await knex('delivery_programme').insert(
        programme,
        ['id'],
      );
      const programmeId = insertProgrammeId[0].id;

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
    },
  );

  it.each(databases.eachSupportedId())(
    'should get all Delivery Projects from the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const programme = {
        ...expectedProgrammeDataWithoutManager,
        arms_length_body_id: albId,
      };
      const insertProgrammeId = await knex('delivery_programme').insert(
        programme,
        ['id'],
      );
      const programmeId = insertProgrammeId[0].id;
      const expectedProject = [
        {
          ...expectedProjectDataWithName,
          delivery_programme_id: programmeId,
          updated_by: 'test',
        },
      ];
      await knex('delivery_project').insert(expectedProject);
      const getAllResult = await projectStore.getAll();
      expect(getAllResult).toHaveLength(1);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a Delivery Project from the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const programme = {
        ...expectedProgrammeDataWithoutManager,
        arms_length_body_id: albId,
      };
      const insertProgrammeId = await knex('delivery_programme').insert(
        programme,
        ['id'],
      );
      const programmeId = insertProgrammeId[0].id;
      const expectedProject: CreateDeliveryProjectRequest = {
        ...expectedProjectDataWithName,
        delivery_programme_id: programmeId,
      };
      const createResult = await projectStore.add(expectedProject, 'test');
      if (!createResult.success) throw new Error('Failed to seed project');
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
    'should return null if a Delivery Project cannot be found in the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const programme = {
        ...expectedProgrammeDataWithoutManager,
        arms_length_body_id: albId,
      };
      const insertProgrammeId = await knex('delivery_programme').insert(
        programme,
        ['id'],
      );
      const programmeId = insertProgrammeId[0].id;
      const expectedProject = [
        {
          ...expectedProjectDataWithName,
          delivery_programme_id: programmeId,
          updated_by: 'test',
        },
      ];
      await knex('delivery_project').insert(expectedProject);

      const getResult = await projectStore.get('12345');

      expect(getResult).toBeNull();
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing Delivery Project in the database',
    async databaseId => {
      const { knex, projectStore } = await createDatabase(databaseId);
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const programme = {
        ...expectedProgrammeDataWithoutManager,
        arms_length_body_id: albId,
      };
      const insertProgrammeId = await knex('delivery_programme').insert(
        programme,
        ['id'],
      );
      const programmeId = insertProgrammeId[0].id;
      const expectedProject = [
        {
          ...expectedProjectDataWithName,
          delivery_programme_id: programmeId,
          updated_by: 'test',
        },
      ];
      const insertProjectId = await knex('delivery_project').insert(
        expectedProject,
        ['id'],
      );
      const currentId = insertProjectId[0].id;

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
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const programme = {
        ...expectedProgrammeDataWithoutManager,
        arms_length_body_id: albId,
      };
      const insertProgrammeId = await knex('delivery_programme').insert(
        programme,
        ['id'],
      );
      const programmeId = insertProgrammeId[0].id;
      const expectedProject = [
        {
          ...expectedProjectDataWithName,
          delivery_programme_id: programmeId,
          updated_by: 'test',
        },
      ];
      await knex('delivery_project').insert(expectedProject, ['id']);

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
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const programme = {
        ...expectedProgrammeDataWithoutManager,
        arms_length_body_id: albId,
      };
      const insertProgrammeId = await knex('delivery_programme').insert(
        programme,
        ['id'],
      );
      const programmeId = insertProgrammeId[0].id;
      const expectedProject = [
        {
          ...expectedProjectDataWithName,
          delivery_programme_id: programmeId,
          updated_by: 'test',
        },
      ];
      await knex('delivery_project').insert(expectedProject, ['id']);

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
        const insertAlbId = await knex('arms_length_body').insert(
          expectedAlbWithName,
          ['id'],
        );
        const albId = insertAlbId[0].id;
        const programme = {
          ...expectedProgrammeDataWithoutManager,
          arms_length_body_id: albId,
        };
        const insertProgrammeId = await knex('delivery_programme').insert(
          programme,
          ['id'],
        );
        const programmeId = insertProgrammeId[0].id;
        const expectedProject = [
          {
            ...expectedProjectDataWithName,
            delivery_programme_id: programmeId,
            updated_by: 'test',
          },
        ];
        const insertProjectId = await knex('delivery_project').insert(
          expectedProject,
          ['id'],
        );
        const expected = insertProjectId[0];
        const name = expectedProject[0].name;

        // act
        const actual = await projectStore.getByName(name);

        // assert
        expect(actual).toMatchObject(expected);
      },
    );
    it.each(databases.eachSupportedId())(
      'Should return null when the project doesnt exist',
      async databaseId => {
        // arrange
        const { projectStore } = await createDatabase(databaseId);

        // act
        const actual = await projectStore.getByName('abc');

        // assert
        expect(actual).toBeNull();
      },
    );
  });
});
