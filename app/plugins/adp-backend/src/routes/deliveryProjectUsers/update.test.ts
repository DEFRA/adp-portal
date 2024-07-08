import update from './update';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  DeliveryProjectUser,
  UpdateDeliveryProjectUserRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  DeliveryProjectUserService,
  deliveryProjectUserServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProjectUserRequest = {
      id: randomUUID(),
      delivery_project_id: randomUUID(),
      is_admin: Math.random() > 0.5,
      is_technical: Math.random() > 0.5,
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
    service.edit.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(1);
    const { id, delivery_project_id, ...editArgs } = data;
    expect(service.edit).toHaveBeenCalledWith(id, editArgs);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should accept all parameters as optional except id and delivery_project_id', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProjectUserRequest = {
      id: randomUUID(),
      delivery_project_id: randomUUID(),
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
    service.edit.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(1);
    const { id, delivery_project_id, ...editArgs } = data;
    expect(service.edit).toHaveBeenCalledWith(id, editArgs);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 400 if the request body is bad', async () => {
    const { app, service } = await setup();
    const data = {
      id: 0,
      delivery_project_id: 0,
      is_admin: 0,
      is_technical: 0,
      github_username: 0,
    };

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(0);
    expect({ status, body }).toMatchObject({
      status: 400,
      body: {
        error: {
          name: 'InputError',
          message: `[
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "delivery_project_id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "number",
    "path": [
      "is_technical"
    ],
    "message": "Expected boolean, received number"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "number",
    "path": [
      "is_admin"
    ],
    "message": "Expected boolean, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "github_username"
    ],
    "message": "Expected string, received number"
  }
]`,
        },
        request: { method: 'PATCH', url: '/' },
        response: { statusCode: 400 },
      },
    });
  });

  it('Should return 400 if the update fails', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProjectUserRequest = {
      id: randomUUID(),
      delivery_project_id: randomUUID(),
      is_admin: Math.random() > 0.5,
      is_technical: Math.random() > 0.5,
      github_username: randomUUID(),
    };
    service.edit.mockResolvedValueOnce({
      success: false,
      errors: ['unknown'],
    });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(1);
    const { id, delivery_project_id, ...editArgs } = data;
    expect(service.edit).toHaveBeenCalledWith(id, editArgs);
    expect({ status, body }).toMatchObject({
      status: 400,
      body: {
        errors: [
          { path: 'root', error: { message: 'An unexpected error occurred.' } },
        ],
      },
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProjectUserRequest = {
      id: randomUUID(),
      delivery_project_id: randomUUID(),
      is_admin: Math.random() > 0.5,
      is_technical: Math.random() > 0.5,
      github_username: randomUUID(),
    };
    service.edit.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(1);
    const { id, delivery_project_id, ...editArgs } = data;
    expect(service.edit).toHaveBeenCalledWith(id, editArgs);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProjectUserService);

  const handler = await testHelpers.getAutoServiceRef(update, [
    testHelpers.provideService(deliveryProjectUserServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.patch('/', handler));

  return { handler, app, service };
}
