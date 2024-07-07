import type {
  CreateDeliveryProjectUserRequest,
  DeliveryProjectUser,
} from '@internal/plugin-adp-common';
import {
  DeliveryProjectUserService,
  deliveryProjectUserServiceRef,
} from '../../services';
import { testHelpers } from '../../utils/testHelpers';
import add from './add';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

describe('default', () => {
  it('Should return ok with the data from the service', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProjectUserRequest = {
      delivery_project_id: randomUUID(),
      is_admin: Math.random() > 0.5,
      is_technical: Math.random() > 0.5,
      user_catalog_name: randomUUID(),
      github_username: randomUUID(),
    };
    const expected: DeliveryProjectUser = {
      aad_entity_ref_id: randomUUID(),
      delivery_project_id: randomUUID(),
      email: randomUUID(),
      id: randomUUID(),
      is_admin: Math.random() > 0.5,
      is_technical: Math.random() > 0.5,
      name: randomUUID(),
      updated_at: new Date(),
      aad_user_principal_name: randomUUID(),
      github_username: randomUUID(),
      user_entity_ref: randomUUID(),
    };
    service.add.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.add).toHaveBeenCalledTimes(1);
    expect(service.add).toHaveBeenCalledWith(
      data.delivery_project_id,
      `user:default/${data.user_catalog_name}`,
      {
        is_admin: data.is_admin,
        is_technical: data.is_technical,
        github_username: data.github_username,
      },
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
      "user_catalog_name"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": [
      "delivery_project_id"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "is_admin"
    ],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "undefined",
    "path": [
      "is_technical"
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
    const data: CreateDeliveryProjectUserRequest = {
      delivery_project_id: randomUUID(),
      is_admin: Math.random() > 0.5,
      is_technical: Math.random() > 0.5,
      user_catalog_name: randomUUID(),
      github_username: randomUUID(),
    };
    service.add.mockResolvedValueOnce({
      success: false,
      errors: [
        'duplicateUser',
        'unknown',
        'unknownCatalogUser',
        'unknownDeliveryProject',
      ],
    });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.add).toHaveBeenCalledTimes(1);
    expect(service.add).toHaveBeenCalledWith(
      data.delivery_project_id,
      `user:default/${data.user_catalog_name}`,
      {
        is_admin: data.is_admin,
        is_technical: data.is_technical,
        github_username: data.github_username,
      },
    );
    expect({ status, body }).toMatchObject({
      status: 400,
      body: {
        errors: [
          {
            path: 'user_catalog_name',
            error: {
              message: `The user ${data.user_catalog_name} has already been added to this delivery project`,
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
            path: 'delivery_project_id',
            error: { message: 'The delivery project does not exist.' },
          },
        ],
      },
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProjectUserService);

  const handler = await testHelpers.getAutoServiceRef(add, [
    testHelpers.provideService(deliveryProjectUserServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.post('/', handler));

  return { handler, app, service };
}
