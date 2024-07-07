import create from './create';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  DeliveryProject,
  CreateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  DeliveryProjectService,
  deliveryProjectServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the service', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProjectRequest = {
      ado_project: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      description: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      service_owner: randomUUID(),
      team_type: randomUUID(),
      title: randomUUID(),
      alias: randomUUID(),
      finance_code: randomUUID(),
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
    service.create.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.create).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 201,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should accept all only alias and finance_code as optional', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProjectRequest = {
      ado_project: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      description: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      service_owner: randomUUID(),
      team_type: randomUUID(),
      title: randomUUID(),
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
    service.create.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.create).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 201,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 400 if the request body is bad', async () => {
    const { app, service } = await setup();
    const data = {
      ado_project: 0,
      delivery_programme_id: 0,
      delivery_project_code: 0,
      description: 0,
      github_team_visibility: 0,
      service_owner: 0,
      team_type: 0,
      title: 0,
      alias: 0,
      finance_code: 0,
    };

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.create).toHaveBeenCalledTimes(0);
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
        request: { method: 'POST', url: '/' },
        response: { statusCode: 400 },
      },
    });
  });

  it('Should return 400 if the add fails', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProjectRequest = {
      ado_project: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      description: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      service_owner: randomUUID(),
      team_type: randomUUID(),
      title: randomUUID(),
      alias: randomUUID(),
      finance_code: randomUUID(),
    };
    service.create.mockResolvedValueOnce({
      success: false,
      errors: [
        'duplicateName',
        'duplicateTitle',
        'unknown',
        'unknownDeliveryProgramme',
      ],
    });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.create).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledWith(data);
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
    const data: CreateDeliveryProjectRequest = {
      ado_project: randomUUID(),
      delivery_programme_id: randomUUID(),
      delivery_project_code: randomUUID(),
      description: randomUUID(),
      github_team_visibility: Math.random() > 0.5 ? 'private' : 'public',
      service_owner: randomUUID(),
      team_type: randomUUID(),
      title: randomUUID(),
      alias: randomUUID(),
      finance_code: randomUUID(),
    };
    service.create.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).post(`/`).send(data);

    expect(service.create).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProjectService);

  const handler = await testHelpers.getAutoServiceRef(create, [
    testHelpers.provideService(deliveryProjectServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.post('/', handler));

  return { handler, app, service };
}
