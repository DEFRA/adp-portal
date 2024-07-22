import type { TestDatabaseId } from '@backstage/backend-test-utils';
import { TestDatabases } from '@backstage/backend-test-utils';
import { ArmsLengthBodyStore } from './armsLengthBodyStore';
import { NotFoundError } from '@backstage/errors';
import { albSeedData, expectedAlbWithName } from '../testData/albTestData';
import { initializeAdpDatabase } from '../database';
import {
  createName,
  type UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import type { arms_length_body } from './arms_length_body';
import { arms_length_body_name } from './arms_length_body';

describe('armsLengthBodyStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await initializeAdpDatabase({
      getClient: () => Promise.resolve(knex),
    });
    const store = new ArmsLengthBodyStore(knex);
    return { knex, store };
  }

  it.each(databases.eachSupportedId())(
    'should create a new ALB',
    async databaseId => {
      const { store } = await createDatabase(databaseId);
      const addResult = await store.add(
        expectedAlbWithName,
        'test',
        'test group',
      );
      if (!addResult.success)
        throw new Error('Failed to update arms length body');
      const added = addResult.value;
      expect(added.name).toEqual(createName(expectedAlbWithName.title));
      expect(added.id).toBeDefined();
      expect(added.created_at).toBeDefined();
      expect(added.updated_at).toBeDefined();
    },
  );

  it.each(databases.eachSupportedId())(
    'should get all ALBs from the database',
    async databaseId => {
      const { store } = await createDatabase(databaseId);

      const getAllResult = await store.getAll();
      expect(getAllResult).toHaveLength(6); // 6 records are seeded
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a ALBs from the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);
      const insertedIds = await knex<arms_length_body>(
        arms_length_body_name,
      ).insert(albSeedData, ['id']);
      const test2Id = insertedIds[0].id;

      const getResult = await store.get(test2Id);

      expect(getResult).toBeDefined();
      expect(getResult?.title).toBe('ALB Example 1');
      expect(getResult?.alias).toBe('ALB 1');
      expect(getResult?.description).toBe('This is an example ALB 1');
      expect(getResult?.creator).toBe('john');
      expect(getResult?.owner).toBe('john');
      expect(getResult?.url).toBe('http://www.example.com/index.html');
    },
  );

  it.each(databases.eachSupportedId())(
    'should throw NotFound if a ALB cannot be found in the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);
      await knex<arms_length_body>(arms_length_body_name).insert(albSeedData);
      const getResult = store.get('12345');
      await expect(getResult).rejects.toBeInstanceOf(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing ALB in the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      const insertedIds = await knex<arms_length_body>(
        arms_length_body_name,
      ).insert(albSeedData, ['id']);
      const test2Id = insertedIds[0].id;
      const expectedUpdate: UpdateArmsLengthBodyRequest = {
        id: test2Id,
        title: 'ALB Example',
        alias: 'ALB',
        description: 'This is an example ALB 2',
        url: 'http://www.example.com/index.html',
      };

      const updateResult = await store.update(expectedUpdate, 'test@test.com');
      if (!updateResult.success)
        throw new Error('Failed to update arms length body');
      const updated = updateResult.value;

      expect(updated).toBeDefined();
      expect(updated.title).toBe(expectedUpdate.title);
      expect(updated.alias).toBe(expectedUpdate.alias);
      expect(updated.url).toBe(expectedUpdate.url);
    },
  );

  it.each(databases.eachSupportedId())(
    'should not update a non-existent ALB',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex<arms_length_body>(arms_length_body_name).insert(albSeedData);

      await expect(
        async () =>
          await store.update(
            {
              id: '1234567',
              title: 'Non-existent ALB',
              alias: 'Non-existent ALB',
              description: 'n/a',
            },
            'test@test.com',
          ),
      ).rejects.toThrow(NotFoundError);
    },
  );

  it.each(databases.eachSupportedId())(
    'should throw an error if existing ALB id is undefined',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex<arms_length_body>(arms_length_body_name).insert(albSeedData);
      await store.getAll();
      const updateWithoutId: UpdateArmsLengthBodyRequest = {
        id: randomUUID(),
        title: 'Non-existent ALB',
        alias: 'Non-existent ALB',
        description: 'n/a',
      };
      await expect(
        async () => await store.update(updateWithoutId, 'test@test.com'),
      ).rejects.toThrow(NotFoundError);
    },
  );
});
