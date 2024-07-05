import {
  type IArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../armsLengthBody';
import getNames from './getNames';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type { ArmsLengthBody } from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';

describe('default', () => {
  async function setup() {
    const albs: jest.Mocked<IArmsLengthBodyStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      getByName: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(getNames, [
      testHelpers.provideService(armsLengthBodyStoreRef, albs),
    ]);

    const app = testHelpers.makeApp(x => x.get('/', handler));

    return { handler, app, albs };
  }

  it('Should return ok with the data from the store', async () => {
    const { app, albs } = await setup();
    const expected = {
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
    };
    albs.getAll.mockResolvedValueOnce(
      Object.entries(expected).map<ArmsLengthBody>(([id, title]) => ({
        created_at: new Date(),
        creator: randomUUID(),
        description: randomUUID(),
        id,
        title,
        name: randomUUID(),
        owner: randomUUID(),
        updated_at: new Date(),
      })),
    );

    const { status, body } = await request(app).get(`/`);

    expect(albs.getAll).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 500 on any errors', async () => {
    const { app, albs } = await setup();
    albs.getAll.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/`);

    expect(albs.getAll).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});
