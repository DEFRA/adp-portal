import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import { EntraIdApi, entraIdApiRef } from '../../entraId';
import { testHelpers } from '../../utils/testHelpers';
import createEntraGroups from './createEntraGroups';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

describe('default', () => {
  it('Should call the api with the correct data', async () => {
    const { app, service } = await setup();
    const data = [...new Array(10)].map<DeliveryProjectUser>(() => ({
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
    }));
    service.createEntraIdGroupsForProjectIfNotExists.mockResolvedValueOnce();

    const { status, body } = await request(app).post('/my-project').send(data);

    expect(
      service.createEntraIdGroupsForProjectIfNotExists,
    ).toHaveBeenCalledTimes(1);
    expect(
      service.createEntraIdGroupsForProjectIfNotExists,
    ).toHaveBeenCalledWith(data, 'my-project');
    expect({ status, body }).toMatchObject({
      status: 204,
      body: {},
    });
  });
  it('Should return 400 when called with bad data', async () => {
    const { app, service } = await setup();
    const data = [...new Array(2)].map(() => ({
      aad_entity_ref_id: 0,
      delivery_project_id: 0,
      email: 0,
      id: 0,
      is_admin: 0,
      is_technical: 0,
      name: 0,
      updated_at: 0,
      aad_user_principal_name: 0,
      github_username: 0,
      user_entity_ref: 0,
    }));

    const { status, body } = await request(app).post('/my-project').send(data);

    expect(service.createEntraIdGroupsForProject).toHaveBeenCalledTimes(0);
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
      0,
      "aad_entity_ref_id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      0,
      "delivery_project_id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      0,
      "email"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      0,
      "id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "number",
    "path": [
      0,
      "is_admin"
    ],
    "message": "Expected boolean, received number"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "number",
    "path": [
      0,
      "is_technical"
    ],
    "message": "Expected boolean, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      0,
      "name"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      0,
      "updated_at"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      0,
      "aad_user_principal_name"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      0,
      "github_username"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      0,
      "user_entity_ref"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "aad_entity_ref_id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "delivery_project_id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "email"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "number",
    "path": [
      1,
      "is_admin"
    ],
    "message": "Expected boolean, received number"
  },
  {
    "code": "invalid_type",
    "expected": "boolean",
    "received": "number",
    "path": [
      1,
      "is_technical"
    ],
    "message": "Expected boolean, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "name"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "updated_at"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "aad_user_principal_name"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "github_username"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      1,
      "user_entity_ref"
    ],
    "message": "Expected string, received number"
  }
]`,
        },
        request: { method: 'POST', url: '/my-project' },
        response: { statusCode: 400 },
      },
    });
  });
});

async function setup() {
  const service = mockInstance(EntraIdApi);

  const handler = await testHelpers.getAutoServiceRef(createEntraGroups, [
    testHelpers.provideService(entraIdApiRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.post('/:projectName', handler));

  return { handler, app, service };
}
