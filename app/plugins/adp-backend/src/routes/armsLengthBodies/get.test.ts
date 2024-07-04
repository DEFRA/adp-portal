import {
  type IArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../armsLengthBody';
import get from './get';
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
    };

    const handler = await testHelpers.getAutoServiceRef(get, [
      testHelpers.provideService(armsLengthBodyStoreRef, albs),
    ]);

    const app = testHelpers.makeApp(x => x.get('/:id', handler));

    return { handler, app, albs };
  }

  it('Should return ok with the data from the store', async () => {
    const { app, albs } = await setup();
    const expected: ArmsLengthBody = {
      created_at: new Date(),
      creator: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      owner: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      alias: randomUUID(),
      children: [],
      updated_by: randomUUID(),
      url: randomUUID(),
    };
    albs.get.mockResolvedValueOnce(expected);

    const { status, body } = await request(app).get(`/${expected.id}`);

    expect(albs.get).toHaveBeenCalledTimes(1);
    expect(albs.get).toHaveBeenCalledWith(expected.id);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 500 on any errors', async () => {
    const { app, albs } = await setup();
    const id = randomUUID();
    albs.get.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/${id}`);

    expect(albs.get).toHaveBeenCalledTimes(1);
    expect(albs.get).toHaveBeenCalledWith(id);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});
