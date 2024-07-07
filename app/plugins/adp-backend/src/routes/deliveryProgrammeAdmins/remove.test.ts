import type { DeleteDeliveryProgrammeAdminRequest } from '@internal/plugin-adp-common';
import {
  DeliveryProgrammeAdminService,
  deliveryProgrammeAdminServiceRef,
} from '../../services';
import { testHelpers } from '../../utils/testHelpers';
import remove from './remove';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

describe('default', () => {
  it('Should return ok with the data from the service', async () => {
    const { app, service } = await setup();
    const data: DeleteDeliveryProgrammeAdminRequest = {
      delivery_programme_admin_id: randomUUID(),
      group_entity_ref: randomUUID(),
    };
    service.remove.mockResolvedValueOnce();

    const { status, body } = await request(app).delete(`/`).send(data);

    expect(service.remove).toHaveBeenCalledTimes(1);
    expect(service.remove).toHaveBeenCalledWith(
      data.delivery_programme_admin_id,
    );
    expect({ status, body }).toMatchObject({
      status: 204,
      body: {},
    });
  });
  it('Should return 400 if the body is bad', async () => {
    const { app, service } = await setup();

    const { status, body } = await request(app).delete(`/`).send({});

    expect(service.remove).toHaveBeenCalledTimes(0);
    expect({ status, body }).toMatchObject({
      status: 400,
      body: {
        error: {
          name: 'InputError',
          message: `[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "delivery_programme_admin_id"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "group_entity_ref"
    ],
    "message": "Required"
  }
]`,
        },
        request: { method: 'DELETE', url: '/' },
        response: { statusCode: 400 },
      },
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProgrammeAdminService);

  const handler = await testHelpers.getAutoServiceRef(remove, [
    testHelpers.provideService(deliveryProgrammeAdminServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.delete('/', handler));

  return { handler, app, service };
}
