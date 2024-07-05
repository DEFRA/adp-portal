import {
  type IArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../armsLengthBody';
import {
  type IDeliveryProgrammeStore,
  deliveryProgrammeStoreRef,
} from '../../deliveryProgramme';
import getAll from './getAll';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import {
  type DeliveryProgramme,
  type ArmsLengthBody,
} from '@internal/plugin-adp-common';
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
    const programmes: jest.Mocked<IDeliveryProgrammeStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      getByName: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(getAll, [
      testHelpers.provideService(armsLengthBodyStoreRef, albs),
      testHelpers.provideService(deliveryProgrammeStoreRef, programmes),
    ]);

    const app = testHelpers.makeApp(x => x.get('/', handler));

    return { handler, app, albs, programmes };
  }

  it('Should return ok with the data from the store', async () => {
    const { app, albs, programmes } = await setup();
    const expected = [...new Array(10)].map<ArmsLengthBody>(() => ({
      created_at: new Date(),
      creator: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      owner: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      alias: randomUUID(),
      children: [randomUUID(), randomUUID(), randomUUID()],
      updated_by: randomUUID(),
      url: randomUUID(),
    }));
    albs.getAll.mockResolvedValueOnce(
      expected.map(x => ({ ...x, children: undefined })),
    );
    programmes.getAll.mockResolvedValueOnce(
      expected.flatMap<DeliveryProgramme>(
        x =>
          x.children?.map(id => ({
            arms_length_body_id: x.id,
            id: id,
            created_at: new Date(),
            delivery_programme_admins: [],
            delivery_programme_code: randomUUID(),
            description: randomUUID(),
            name: randomUUID(),
            title: randomUUID(),
            updated_at: new Date(),
            alias: randomUUID(),
          })) ?? [],
      ),
    );

    const { status, body } = await request(app).get(`/`);

    expect(albs.getAll).toHaveBeenCalledTimes(1);
    expect(programmes.getAll).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 500 when the albStore errors', async () => {
    const { app, albs, programmes } = await setup();
    albs.getAll.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/`);

    expect(albs.getAll).toHaveBeenCalledTimes(1);
    expect(programmes.getAll).toHaveBeenCalledTimes(0);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });

  it('Should return 500 when the programmeStore errors', async () => {
    const { app, albs, programmes } = await setup();
    albs.getAll.mockResolvedValueOnce([]);
    programmes.getAll.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/`);

    expect(albs.getAll).toHaveBeenCalledTimes(1);
    expect(programmes.getAll).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});
