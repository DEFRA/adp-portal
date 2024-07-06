import getForProgramme from './getForProgramme';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  deliveryProgrammeAdminServiceRef,
  type IDeliveryProgrammeAdminService,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const expected = [...new Array(10)].map<DeliveryProgrammeAdmin>(() => ({
      aad_entity_ref_id: randomUUID(),
      delivery_programme_id: randomUUID(),
      email: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      updated_at: new Date(),
      user_entity_ref: randomUUID(),
    }));
    service.getByProgramme.mockResolvedValueOnce(
      expected.map(x => ({ ...x, children: undefined })),
    );

    const { status, body } = await request(app).get(`/abc`);

    expect(service.getByProgramme).toHaveBeenCalledTimes(1);
    expect(service.getByProgramme).toHaveBeenCalledWith('abc');
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    service.getByProgramme.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/abc`);

    expect(service.getByProgramme).toHaveBeenCalledTimes(1);
    expect(service.getByProgramme).toHaveBeenCalledWith('abc');
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service: jest.Mocked<IDeliveryProgrammeAdminService> = {
    add: jest.fn(),
    getAll: jest.fn(),
    getByProgramme: jest.fn(),
    remove: jest.fn(),
  };

  const handler = await testHelpers.getAutoServiceRef(getForProgramme, [
    testHelpers.provideService(deliveryProgrammeAdminServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.get('/:deliveryProgrammeId', handler));

  return { handler, app, service };
}
