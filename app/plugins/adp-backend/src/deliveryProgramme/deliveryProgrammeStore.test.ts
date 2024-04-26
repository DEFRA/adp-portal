import { TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';
import {
  DeliveryProgrammeStore,
  PartialDeliveryProgramme,
} from './deliveryProgrammeStore';
import { NotFoundError } from '@backstage/errors';
import { createName } from '../utils/index';
import { expectedAlbWithName } from '../testData/albTestData';
import {
  DeliveryProgramme,
} from '@internal/plugin-adp-common';
import {
  expectedProgrammeDataWithName,
  expectedProgrammeDataWithoutManager,
} from '../testData/programmeTestData';
import { initializeAdpDatabase } from '../database';

describe('DeliveryProgrammeStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await initializeAdpDatabase({
      getClient: () => Promise.resolve(knex),
    });
    const programmeStore = new DeliveryProgrammeStore(await knex);

    return { knex, programmeStore };
  }

  it.each(databases.eachSupportedId())(
    'should create a new Delivery Programme',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(
        databaseId,
      );

      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );

      const albId = insertAlbId[0].id;

      const expectedDeliveryProgramme: Omit<
        DeliveryProgramme,
        'id' | 'created_at' | 'updated_at' | 'programme_managers'
      > = {
        ...expectedProgrammeDataWithName,
        arms_length_body_id: albId,
      };

      const addResult = await programmeStore.add(expectedDeliveryProgramme, 'test');

      expect(addResult.name).toEqual(createName(expectedDeliveryProgramme.title));
      expect(addResult.id).toBeDefined();
      expect(addResult.created_at).toBeDefined();
      expect(addResult.updated_at).toBeDefined();
    },
  );

  it.each(databases.eachSupportedId())(
    'should get all Delivery Programmes from the database',
    async databaseId => {
      const { programmeStore } = await createDatabase(databaseId);
      const getAllResult = await programmeStore.getAll();
      expect(getAllResult).toHaveLength(7);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a Delivery Programmes from the database',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );

      const albId = insertAlbId[0].id;
      const expectedProgramme = [
        {
          ...expectedProgrammeDataWithoutManager,
          arms_length_body_id: albId,
        },
      ];
      const insertProgrammeId = await knex('delivery_programme').insert(
        expectedProgramme,
        ['id'],
      );

      const programmeId = insertProgrammeId[0].id;
      const getResult = await programmeStore.get(programmeId);

      expect(getResult).toBeDefined();
      expect(getResult?.title).toBe(
        'Test title expectedProgrammeDataWithoutManager',
      );
      expect(getResult?.alias).toBe('Test Alias');
      expect(getResult?.description).toBe('Test description');
      expect(getResult?.url).toBe('Test url');
    },
  );

  it.each(databases.eachSupportedId())(
    'should return null if a Delivery Programme cannot be found in the database',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const expectedProgramme = [
        {
          ...expectedProgrammeDataWithoutManager,
          arms_length_body_id: albId,
        },
      ];
      await knex('delivery_programme').insert(expectedProgramme);

      const getResult = await programmeStore.get('12345');

      expect(getResult).toBeNull();
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing Delivery Programme in the database',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const expectedProgramme = [
        {
          ...expectedProgrammeDataWithoutManager,
          arms_length_body_id: albId,
        },
      ];
      const insertProgrammeId = await knex('delivery_programme').insert(
        expectedProgramme,
        ['id'],
      );

      const currentId = insertProgrammeId[0].id;
      const expectedUpdate: PartialDeliveryProgramme = {
        id: currentId,
        title: 'Programme Example',
        alias: 'programme',
        description: 'This is an example Delivery Programme 2',
        url: 'http://www.example.com/index.html',
      };

      const updateResult = await programmeStore.update(
        expectedUpdate,
        'test1@test.com',
      );

      expect(updateResult).toBeDefined();
      expect(updateResult.title).toBe(expectedUpdate.title);
      expect(updateResult.alias).toBe(expectedUpdate.alias);
      expect(updateResult.url).toBe(expectedUpdate.url);
      expect(updateResult.updated_at).toBeDefined();
    },
  );

  it.each(databases.eachSupportedId())(
    'should not update a non-existent Delivery Programme',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const expectedProgramme = [
        {
          ...expectedProgrammeDataWithoutManager,
          arms_length_body_id: albId,
        },
      ];
      await knex('delivery_programme').insert(expectedProgramme);

      await expect(
        async () =>
          await programmeStore.update(
            {
              id: '1234567',
              title: 'Test title 3',
              alias: 'Test Alias',
            },
            'test@test.com',
          ),
      ).rejects.toThrow(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should throw an error if existing Programme id is undefined',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);

      await knex('arms_length_body').insert(expectedAlbWithName);
      await programmeStore.getAll();

      const insertAlbId = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const albId = insertAlbId[0].id;
      const updateWithoutId = {
        ...expectedProgrammeDataWithoutManager,
        arms_length_body_id: albId,
      };
      await expect(
        async () =>
          await programmeStore.update(updateWithoutId, 'test@test.com'),
      ).rejects.toThrow(NotFoundError);
    },
  );
});
