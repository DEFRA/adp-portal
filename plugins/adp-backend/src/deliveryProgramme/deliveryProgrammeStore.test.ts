import type { TestDatabaseId } from '@backstage/backend-test-utils';
import { TestDatabases } from '@backstage/backend-test-utils';
import { DeliveryProgrammeStore } from './deliveryProgrammeStore';
import { NotFoundError } from '@backstage/errors';
import { albSeedData } from '../testData/albTestData';
import {
  createName,
  type CreateDeliveryProgrammeRequest,
  type UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import {
  deliveryProgrammeSeedData,
  expectedProgrammeDataWithName,
  expectedProgrammeDataWithoutManager,
} from '../testData/programmeTestData';
import { initializeAdpDatabase } from '../database';
import type { delivery_programme } from './delivery_programme';
import { delivery_programme_name } from './delivery_programme';
import type { arms_length_body } from '../armsLengthBody/arms_length_body';
import { arms_length_body_name } from '../armsLengthBody/arms_length_body';
import type { Knex } from 'knex';

describe('DeliveryProgrammeStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await initializeAdpDatabase({
      getClient: () => Promise.resolve(knex),
    });
    const programmeStore = new DeliveryProgrammeStore(knex);

    return { knex, programmeStore };
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

  it.each(databases.eachSupportedId())(
    'should create a new Delivery Programme',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      const albId = await seedAlb(knex);

      const expectedDeliveryProgramme: CreateDeliveryProgrammeRequest = {
        ...expectedProgrammeDataWithName,
        arms_length_body_id: albId,
      };

      const addResult = await programmeStore.add(
        expectedDeliveryProgramme,
        'test',
      );
      if (!addResult.success) throw new Error('Failed to add programme');
      const added = addResult.value;

      expect(added.name).toEqual(createName(expectedDeliveryProgramme.title));
      expect(added.id).toBeDefined();
      expect(added.created_at).toBeDefined();
      expect(added.updated_at).toBeDefined();
    },
  );

  it.each(databases.eachSupportedId())(
    'should get all Delivery Programmes from the database',
    async databaseId => {
      const { programmeStore } = await createDatabase(databaseId);
      const getAllResult = await programmeStore.getAll();
      expect(getAllResult).toHaveLength(8);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a Delivery Programmes from the database',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      const programmeId = await seedProgramme(knex);
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
    'should throw NotFound if a Delivery Programme cannot be found in the database',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      await seedProgramme(knex);

      const getResult = programmeStore.get('12345');

      await expect(getResult).rejects.toBeInstanceOf(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing Delivery Programme in the database',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      const currentId = await seedProgramme(knex);

      const expectedUpdate: UpdateDeliveryProgrammeRequest = {
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
      if (!updateResult.success) throw new Error('Failed to update programme');
      const updated = updateResult.value;

      expect(updated).toBeDefined();
      expect(updated.title).toBe(expectedUpdate.title);
      expect(updated.alias).toBe(expectedUpdate.alias);
      expect(updated.url).toBe(expectedUpdate.url);
      expect(updated.updated_at).toBeDefined();
    },
  );

  it.each(databases.eachSupportedId())(
    'should not update a non-existent Delivery Programme',
    async databaseId => {
      const { knex, programmeStore } = await createDatabase(databaseId);
      await seedProgramme(knex);

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
      const albId = await seedAlb(knex);
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
