import { TestDatabaseId, TestDatabases } from '@backstage/backend-test-utils';
import { AdpDatabase } from '../database/adpDatabase';
import { DeliveryProgrammesStore } from './deliveryProgrammesStore';
import { NotFoundError } from '@backstage/errors';
import { DeliveryProgramme } from '../types';

describe('deliveryProgrammesStore', () => {
  const databases = TestDatabases.create();

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    await AdpDatabase.runMigrations(knex);
    const store = new DeliveryProgrammesStore(knex);
    return { knex, store };
  }

  it.each(databases.eachSupportedId())(
    'should create a new delivery programme',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);
      const expectedProgramme: Omit<DeliveryProgramme, 'id' | 'timestamp'> = {
        name: 'test-programme',
        title: 'Test Programme',
        armsLengthBody: 'defra',
        deliveryProgrammeCode: 100,
        description: 'Testing testing testing',
      };

      const addResult = await store.add(expectedProgramme, 'test@test.com');

      expect(addResult.id).toBeDefined();
      expect(addResult.timestamp).toBeDefined();
    },
  );

  it.each(databases.eachSupportedId())(
    'should get all delivery programmes from the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex('delivery_programmes').insert([
        {
          name: 'Test 1',
          arms_length_body: 'ALB 1',
          programme_code: 100,
          created_by: 'test',
          updated_by: 'test',
        },
        {
          name: 'Test 2',
          arms_length_body: 'ALB 2',
          programme_code: 200,
          created_by: 'test',
          updated_by: 'test',
        },
        {
          name: 'Test 3',
          arms_length_body: 'ALB 3',
          programme_code: 300,
          created_by: 'test',
          updated_by: 'test',
        },
      ]);

      const getAllResult = await store.getAll();
      expect(getAllResult).toHaveLength(3);
    },
  );

  it.each(databases.eachSupportedId())(
    'should get a delivery programmes from the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      const insertedIds = await knex('delivery_programmes').insert(
        [
          {
            name: 'Test 1',
            arms_length_body: 'ALB 1',
            programme_code: 100,
            created_by: 'test',
            updated_by: 'test',
          },
          {
            name: 'Test 2',
            arms_length_body: 'ALB 2',
            programme_code: 200,
            created_by: 'test',
            updated_by: 'test',
          },
          {
            name: 'Test 3',
            arms_length_body: 'ALB 3',
            programme_code: 300,
            created_by: 'test',
            updated_by: 'test',
          },
        ],
        ['id'],
      );

      // Get the 'Test 2' delivery programme
      const test2Id = insertedIds[1].id;
      const getResult = await store.get(test2Id);

      expect(getResult).toBeDefined();
      expect(getResult?.name).toBe('Test 2');
      expect(getResult?.armsLengthBody).toBe('ALB 2');
      expect(getResult?.deliveryProgrammeCode).toBe(200);
    },
  );

  it.each(databases.eachSupportedId())(
    'should return null if a delivery programme cannot be found in the database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex('delivery_programmes').insert([
        {
          name: 'Test 1',
          arms_length_body: 'ALB 1',
          programme_code: 100,
          created_by: 'test',
          updated_by: 'test',
        },
        {
          name: 'Test 2',
          arms_length_body: 'ALB 2',
          programme_code: 200,
          created_by: 'test',
          updated_by: 'test',
        },
        {
          name: 'Test 3',
          arms_length_body: 'ALB 3',
          programme_code: 300,
          created_by: 'test',
          updated_by: 'test',
        },
      ]);

      const getResult = await store.get('12345');

      expect(getResult).toBeNull();
    },
  );

  it.each(databases.eachSupportedId())(
    'should update an existing delivery programme in the database database',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      const insertedIds = await knex('delivery_programmes').insert(
        [
          {
            name: 'Test 1',
            arms_length_body: 'ALB 1',
            programme_code: 100,
            created_by: 'test',
            updated_by: 'test',
          },
          {
            name: 'Test 2',
            arms_length_body: 'ALB 2',
            programme_code: 200,
            created_by: 'test',
            updated_by: 'test',
          },
          {
            name: 'Test 3',
            arms_length_body: 'ALB 3',
            programme_code: 300,
            created_by: 'test',
            updated_by: 'test',
          },
        ],
        ['id'],
      );

      // Get the 'Test 2' delivery programme
      const test2Id = insertedIds[1].id;
      const expectedUpdate: DeliveryProgramme = {
        id: test2Id,
        name: 'Updated test 2',
        title: 'Updated test 2',
        armsLengthBody: 'ALB 2',
        deliveryProgrammeCode: 200,
        description: 'Delivery programme description',
        timestamp: new Date(2023, 12, 31, 15, 0, 0).getMilliseconds(),
      };

      const updateResult = await store.update(expectedUpdate, 'test@test.com');

      expect(updateResult).toBeDefined();
      expect(updateResult.name).toBe(expectedUpdate.name);
      expect(updateResult.description).toBe(expectedUpdate.description);
    },
  );

  it.each(databases.eachSupportedId())(
    'should no update a non-existent delivery programme',
    async databaseId => {
      const { knex, store } = await createDatabase(databaseId);

      await knex('delivery_programmes').insert([
        {
          name: 'Test 1',
          arms_length_body: 'ALB 1',
          programme_code: 100,
          created_by: 'test',
          updated_by: 'test',
        },
        {
          name: 'Test 2',
          arms_length_body: 'ALB 2',
          programme_code: 200,
          created_by: 'test',
          updated_by: 'test',
        },
        {
          name: 'Test 3',
          arms_length_body: 'ALB 3',
          programme_code: 300,
          created_by: 'test',
          updated_by: 'test',
        },
      ]);

      await expect(
        async () =>
          await store.update(
            {
              id: '1234567',
              name: 'Non-existent programme',
              title: 'Non-existent programme',
              armsLengthBody: 'NOOO',
              deliveryProgrammeCode: 200,
            },
            'test@test.com',
          ),
      ).rejects.toThrow(NotFoundError);
    },
  );
});
