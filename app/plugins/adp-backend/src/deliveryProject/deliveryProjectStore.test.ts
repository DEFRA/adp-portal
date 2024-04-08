import { TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';
import { AdpDatabase } from '../database/adpDatabase';
import {
  DeliveryProjectStore,
  PartialDeliveryProject,
} from './deliveryProjectStore';
import { NotFoundError } from '@backstage/errors';
import { DeliveryProject } from '@internal/plugin-adp-common';
import { expectedProjectDataWithName } from '../testData/projectTestData';
import { expectedProgrammeDataWithoutManager } from '../testData/programmeTestData';
import { expectedAlbWithName } from '../testData/albTestData';

describe('DeliveryProjectStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    const db = AdpDatabase.create({
      getClient: () => Promise.resolve(knex),
    });
    const projectStore = new DeliveryProjectStore(await db.get());

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

      const expectedProject: Omit<
        DeliveryProject,
        'id' | 'created_at' | 'updated_at'
      > = {
        ...expectedProjectDataWithName,
        delivery_programme_id: programmeId,
      };

      const addResult = await projectStore.add(expectedProject, 'test');

      expect(addResult.title).toEqual(expectedProject.title);
      expect(addResult.id).toBeDefined();
      expect(addResult.created_at).toBeDefined();
      expect(addResult.updated_at).toBeDefined();
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
      const expectedProject = {
        ...expectedProjectDataWithName,
        delivery_programme_id: programmeId,
      };
      const createdProject = await projectStore.add(expectedProject, 'test');

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

      const expectedUpdate: PartialDeliveryProject = {
        id: currentId,
        title: 'Test title updated',
      };

      const updateResult = await projectStore.update(
        expectedUpdate,
        'test1@test.com',
      );

      expect(updateResult).toBeDefined();
      expect(updateResult.title).toBe(expectedUpdate.title);
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

      const expectedUpdate: PartialDeliveryProject = {
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

      const expectedUpdate: PartialDeliveryProject = {
        title: 'Test title updated',
      };

      await expect(
        async () => await projectStore.update(expectedUpdate, 'test1@test.com'),
      ).rejects.toThrow(NotFoundError);
    },
  );
});
