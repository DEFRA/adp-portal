import { TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';
import { AdpDatabase } from '../database/adpDatabase';
import {
  ArmsLengthBodyStore,
  PartialArmsLengthBody,
} from './armsLengthBodyStore';
import { NotFoundError } from '@backstage/errors';
import { ArmsLengthBody } from '../types';
import { createName } from '../utils';

describe('armsLengthBodyStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await AdpDatabase.runMigrations(knex);
    const store = new ArmsLengthBodyStore(knex);
    return { knex, store };
  }

  it.each(databases.eachSupportedId())(
    'should create a new ALB',
    async databaseId => {
      const { store } = await createDatabase(databaseId);
      const expectedALB: Omit<ArmsLengthBody, 'id' | 'timestamp'> = {
        creator: 'john',
        owner: 'john',
        title: 'ALB Example',
        short_name: 'ALB',
        description: 'This is an example ALB',
        url: 'http://www.example.com/index.html',
        name: 'alb-example',
      };

      const addResult = await store.add(expectedALB, 'test', 'test group');

      expect(addResult.name).toEqual(createName(expectedALB.title));
      expect(addResult.id).toBeDefined();
      expect(addResult.timestamp).toBeDefined();
    },
  );

  it.each(databases.eachSupportedId())(
    'should get all ALBs from the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex('arms_length_body').insert([
        {
          creator: 'john',
          owner: 'john',
          title: 'ALB Example 1',
          short_name: 'ALB 1',
          description: 'This is an example ALB 1',
          url: 'http://www.example.com/index.html',
          name: 'alb-example-1',
          updated_by: 'john',
        },
        {
          creator: 'john',
          owner: 'johnD',
          title: 'ALB Example 2',
          short_name: 'ALB 2',
          description: 'This is an example ALB 2',
          name: 'alb-example-2',
          updated_by: 'john',
        },
        {
          creator: 'john',
          owner: 'john',
          title: 'ALB Example 3',
          short_name: 'ALB 3',
          description: 'This is an example ALB 3',
          url: 'http://www.example.com/index.html',
          name: 'alb-example-4',
          updated_by: 'john',
        },
      ]);

      const getAllResult = await store.getAll();
      expect(getAllResult).toHaveLength(3);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a ALBs from the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      const insertedIds = await knex('arms_length_body').insert(
        [
          {
            creator: 'john',
            owner: 'john',
            title: 'ALB Example 1',
            short_name: 'ALB 1',
            description: 'This is an example ALB 1',
            url: 'http://www.example.com/index.html',
            updated_by: 'john',
            name: 'alb-example-1',
          },
          {
            creator: 'john',
            owner: 'johnD',
            title: 'ALB Example 2',
            short_name: 'ALB 2',
            description: 'This is an example ALB 2',
            url: 'http://www.example.com/index.html',
            updated_by: 'john',
            name: 'alb-example-2',
          },
          {
            creator: 'john',
            owner: 'john',
            title: 'ALB Example 3',
            short_name: 'ALB 3',
            description: 'This is an example ALB 3',
            url: 'http://www.example.com/index.html',
            updated_by: 'john',
            name: 'alb-example-3',
          },
        ],
        ['id'],
      );

      // Get the 'Test 2' ALB
      const test2Id = insertedIds[1].id;
      const getResult = await store.get(test2Id);

      expect(getResult).toBeDefined();
      expect(getResult?.title).toBe('ALB Example 2');
      expect(getResult?.short_name).toBe('ALB 2');
      expect(getResult?.description).toBe('This is an example ALB 2');
      expect(getResult?.creator).toBe('john');
      expect(getResult?.owner).toBe('johnD');
      expect(getResult?.url).toBe('http://www.example.com/index.html');
    },
  );

  it.each(databases.eachSupportedId())(
    'should return null if a ALB cannot be found in the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex('arms_length_body').insert([
        {
          creator: 'john',
          owner: 'john',
          title: 'ALB Example 1',
          short_name: 'ALB 1',
          description: 'This is an example ALB 1',
          updated_by: 'john',
          name: 'alb-example-1',
        },
        {
          creator: 'john',
          owner: 'johnD',
          title: 'ALB Example 2',
          short_name: 'ALB 2',
          description: 'This is an example ALB 2',
          updated_by: 'john',
          name: 'alb-example-2',
        },
      ]);

      const getResult = await store.get('12345');

      expect(getResult).toBeNull();
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing ALB in the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      const insertedIds = await knex('arms_length_body').insert(
        [
          {
            creator: 'john',
            owner: 'john',
            title: 'ALB Example 1',
            short_name: 'ALB 1',
            description: 'This is an example ALB 1',
            updated_by: 'john',
            name: 'alb-example-1',
          },
          {
            creator: 'john',
            owner: 'johnD',
            title: 'ALB Example 2',
            short_name: 'ALB 2',
            description: 'This is an example ALB 2',
            updated_by: 'john',
            name: 'alb-example-2',
          },
        ],
        ['id'],
      );

      // Get the 'Test 2' ALB
      const test2Id = insertedIds[1].id;
      const expectedUpdate: PartialArmsLengthBody = {
        id: test2Id,
        title: 'ALB Example',
        short_name: 'ALB',
        description: 'This is an example ALB 2',
        url: 'http://www.example.com/index.html',
        timestamp: new Date(2023, 12, 31, 15, 0, 0),
      };

      const updateResult = await store.update(expectedUpdate, 'test@test.com');

      expect(updateResult).toBeDefined();
      expect(updateResult.title).toBe(expectedUpdate.title);
      expect(updateResult.short_name).toBe(expectedUpdate.short_name);
      expect(updateResult.url).toBe(expectedUpdate.url);
    },
  );

  it.each(databases.eachSupportedId())(
    'should not update a non-existent ALB',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex('arms_length_body').insert([
        {
          creator: 'john',
          owner: 'john',
          title: 'ALB Example 1',
          short_name: 'ALB 1',
          description: 'This is an example ALB 1',
          updated_by: 'john',
          name: 'alb-example-1',
        },
        {
          creator: 'john',
          owner: 'johnD',
          title: 'ALB Example 2',
          short_name: 'ALB 2',
          description: 'This is an example ALB 2',
          updated_by: 'john',
          name: 'alb-example-2',
        },
        {
          creator: 'john',
          owner: 'john',
          title: 'ALB Example 3',
          short_name: 'ALB 3',
          description: 'This is an example ALB 3',
          updated_by: 'john',
          name: 'alb-example-3',
        },
      ]);

      await expect(
        async () =>
          await store.update(
            {
              id: '1234567',
              creator: 'n/a',
              owner: 'n/a',
              title: 'Non-existent ALB',
              short_name: 'Non-existent ALB',
              name: 'non-existent-alb',
              description: 'n/a',
            },
            'test@test.com',
          ),
      ).rejects.toThrow(NotFoundError);
    },
  );
});
