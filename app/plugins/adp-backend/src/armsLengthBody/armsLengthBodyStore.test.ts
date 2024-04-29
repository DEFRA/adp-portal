import { TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';
import {
  ArmsLengthBodyStore,
  PartialArmsLengthBody,
} from './armsLengthBodyStore';
import { NotFoundError } from '@backstage/errors';
import { createName } from '../utils/index';
import { expectedAlbWithName } from '../testData/albTestData';
import { initializeAdpDatabase } from '../database';

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
      expect(addResult.name).toEqual(createName(expectedAlbWithName.title));
      expect(addResult.id).toBeDefined();
      expect(addResult.created_at).toBeDefined();
      expect(addResult.updated_at).toBeDefined();
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
      const insertedIds = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
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
    'should return null if a ALB cannot be found in the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);
      await knex('arms_length_body').insert(expectedAlbWithName);
      const getResult = await store.get('12345');
      expect(getResult).toBeNull();
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing ALB in the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      const insertedIds = await knex('arms_length_body').insert(
        expectedAlbWithName,
        ['id'],
      );
      const test2Id = insertedIds[0].id;
      const expectedUpdate: PartialArmsLengthBody = {
        id: test2Id,
        title: 'ALB Example',
        alias: 'ALB',
        description: 'This is an example ALB 2',
        url: 'http://www.example.com/index.html',
      };

      const updateResult = await store.update(expectedUpdate, 'test@test.com');

      expect(updateResult).toBeDefined();
      expect(updateResult.title).toBe(expectedUpdate.title);
      expect(updateResult.alias).toBe(expectedUpdate.alias);
      expect(updateResult.url).toBe(expectedUpdate.url);
    },
  );

  it.each(databases.eachSupportedId())(
    'should not update a non-existent ALB',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex('arms_length_body').insert(expectedAlbWithName);

      await expect(
        async () =>
          await store.update(
            {
              id: '1234567',
              creator: 'n/a',
              owner: 'n/a',
              title: 'Non-existent ALB',
              alias: 'Non-existent ALB',
              name: 'non-existent-alb',
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

      await knex('arms_length_body').insert(expectedAlbWithName);
      await store.getAll();
      const updateWithoutId = {
        creator: 'n/a',
        owner: 'n/a',
        title: 'Non-existent ALB',
        alias: 'Non-existent ALB',
        name: 'non-existent-alb',
        description: 'n/a',
      };
      await expect(
        async () => await store.update(updateWithoutId, 'test@test.com'),
      ).rejects.toThrow(NotFoundError);
    },
  );
});
