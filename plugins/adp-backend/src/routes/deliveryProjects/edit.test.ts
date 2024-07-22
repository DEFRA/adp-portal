import edit from './edit';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  DeliveryProject,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  DeliveryProjectService,
  deliveryProjectServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProjectRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      ado_project: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      finance_code: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      service_owner: randomUUID(),
      team_type: randomUUID(),
    };
    const expected: DeliveryProject = {
      alias: randomUUID(),
      ado_project: randomUUID(),
      created_at: new Date(),
      delivery_programme_code: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      namespace: randomUUID(),
      service_owner: randomUUID(),
      team_type: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      finance_code: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      updated_by: randomUUID(),
    };
    service.edit.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(1);
    expect(service.edit).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should accept all parameters as optional except id', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProjectRequest = {
      id: randomUUID(),
    };
    const expected: DeliveryProject = {
      alias: randomUUID(),
      ado_project: randomUUID(),
      created_at: new Date(),
      delivery_programme_code: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      namespace: randomUUID(),
      service_owner: randomUUID(),
      team_type: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      finance_code: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      updated_by: randomUUID(),
    };
    service.edit.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(1);
    expect(service.edit).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 400 if the request body is bad', async () => {
    const { app, service } = await setup();
    const data = {
      id: 0,
      alias: 0,
      description: 0,
      title: 0,
      ado_project: 0,
      delivery_programme_id: 0,
      delivery_project_code: 0,
      finance_code: 0,
      github_team_visibility: 0,
      service_owner: 0,
      team_type: 0,
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
      "title"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "alias"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "description"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "finance_code"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "delivery_programme_id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "delivery_project_code"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "ado_project"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "team_type"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "service_owner"
    ],
    "message": "Expected string, received number"
  },
  {
    "expected": "'public' | 'private'",
    "received": "number",
    "code": "invalid_type",
    "path": [
      "github_team_visibility"
    ],
    "message": "Expected 'public' | 'private', received number"
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
    const data: UpdateDeliveryProjectRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      ado_project: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      finance_code: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      service_owner: randomUUID(),
      team_type: randomUUID(),
    };
    service.edit.mockResolvedValueOnce({
      success: false,
      errors: ['duplicateTitle', 'unknown', 'unknownDeliveryProgramme'],
    });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(1);
    expect(service.edit).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 400,
      body: {
        errors: [
          {
            path: 'title',
            error: {
              message: `The name '${data.title}' is already in use. Please choose a different name.`,
            },
          },
          { path: 'root', error: { message: 'An unexpected error occurred.' } },
          {
            path: 'delivery_programme_id',
            error: { message: 'The delivery programme does not exist.' },
          },
        ],
      },
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProjectRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      ado_project: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      finance_code: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      service_owner: randomUUID(),
      team_type: randomUUID(),
    };
    service.edit.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.edit).toHaveBeenCalledTimes(1);
    expect(service.edit).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProjectService);

  const handler = await testHelpers.getAutoServiceRef(edit, [
    testHelpers.provideService(deliveryProjectServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.patch('/', handler));

  return { handler, app, service };
}
