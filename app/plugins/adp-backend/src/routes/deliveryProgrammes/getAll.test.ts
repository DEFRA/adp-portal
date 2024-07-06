import getAll from './getAll';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import { type DeliveryProgramme } from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  type IDeliveryProgrammeService,
  deliveryProgrammeServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const expected = [...new Array(10)].map<DeliveryProgramme>(() => ({
      alias: randomUUID(),
      arms_length_body_id: randomUUID(),
      created_at: new Date(),
      delivery_programme_code: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      updated_by: randomUUID(),
      url: randomUUID(),
    }));
    service.getAll.mockResolvedValueOnce(
      expected.map(x => ({ ...x, children: undefined })),
    );

    const { status, body } = await request(app).get(`/`);

    expect(service.getAll).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    service.getAll.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/`);

    expect(service.getAll).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service: jest.Mocked<IDeliveryProgrammeService> = {
    create: jest.fn(),
    getAll: jest.fn(),
    getById: jest.fn(),
    edit: jest.fn(),
  };

  const handler = await testHelpers.getAutoServiceRef(getAll, [
    testHelpers.provideService(deliveryProgrammeServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.get('/', handler));

  return { handler, app, service };
}
