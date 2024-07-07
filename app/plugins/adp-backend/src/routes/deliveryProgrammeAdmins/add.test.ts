import type {
  CreateDeliveryProgrammeAdminRequest,
  DeliveryProgrammeAdmin,
} from '@internal/plugin-adp-common';
import {
  DeliveryProgrammeAdminService,
  deliveryProgrammeAdminServiceRef,
} from '../../services';
import { testHelpers } from '../../utils/testHelpers';
import add from './add';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

describe('default', () => {
  it('Should return ok with the data from the service', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProgrammeAdminRequest = {
      delivery_programme_id: randomUUID(),
      group_entity_ref: randomUUID(),
      user_catalog_name: randomUUID(),
    };
    const expected: DeliveryProgrammeAdmin = {
      aad_entity_ref_id: randomUUID(),
      delivery_programme_id: randomUUID(),
      email: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      updated_at: new Date(),
      user_entity_ref: randomUUID(),
    };
    service.add.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.add).toHaveBeenCalledTimes(1);
    expect(service.add).toHaveBeenCalledWith(
      data.delivery_programme_id,
      `user:default/${data.user_catalog_name}`,
    );
    expect({ status, body }).toMatchObject({
      status: 201,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });
  it('Should return 400 if the body is bad', async () => {
    const { app, service } = await setup();

    const { status, body } = await request(app).post(`/`).send({});

    expect(service.add).toHaveBeenCalledTimes(0);
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
      "delivery_programme_id"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "user_catalog_name"
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
        request: { method: 'POST', url: '/' },
        response: { statusCode: 400 },
      },
    });
  });
  it('Should return 400 if the add fails', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProgrammeAdminRequest = {
      delivery_programme_id: randomUUID(),
      group_entity_ref: randomUUID(),
      user_catalog_name: randomUUID(),
    };
    service.add.mockResolvedValueOnce({
      success: false,
      errors: [
        'duplicateUser',
        'unknown',
        'unknownCatalogUser',
        'unknownDeliveryProgramme',
      ],
    });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.add).toHaveBeenCalledTimes(1);
    expect(service.add).toHaveBeenCalledWith(
      data.delivery_programme_id,
      `user:default/${data.user_catalog_name}`,
    );
    expect({ status, body }).toMatchObject({
      status: 400,
      body: {
        errors: [
          {
            path: 'user_catalog_name',
            error: {
              message: `The user ${data.user_catalog_name} has already been added to this delivery programme`,
            },
          },
          { path: 'root', error: { message: 'An unexpected error occurred.' } },
          {
            path: 'user_catalog_name',
            error: {
              message: `The user ${data.user_catalog_name} could not be found in the Catalog`,
            },
          },
          {
            path: 'delivery_programme_id',
            error: { message: 'The delivery programme does not exist.' },
          },
        ],
      },
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProgrammeAdminService);

  const handler = await testHelpers.getAutoServiceRef(add, [
    testHelpers.provideService(deliveryProgrammeAdminServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.post('/', handler));

  return { handler, app, service };
}
