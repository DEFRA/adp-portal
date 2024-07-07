import create from './create';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  ArmsLengthBody,
  CreateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  ArmsLengthBodyService,
  armsLengthBodyServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the service', async () => {
    const { app, service } = await setup();
    const data: CreateArmsLengthBodyRequest = {
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    const expected: ArmsLengthBody = {
      created_at: new Date(),
      creator: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      owner: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      alias: randomUUID(),
      updated_by: randomUUID(),
      url: randomUUID(),
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

  it('Should accept all parameters as optional except title and description', async () => {
    const { app, service } = await setup();
    const data: CreateArmsLengthBodyRequest = {
      title: randomUUID(),
      description: randomUUID(),
    };
    const expected: ArmsLengthBody = {
      created_at: new Date(),
      creator: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      owner: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      alias: randomUUID(),
      updated_by: randomUUID(),
      url: randomUUID(),
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
      alias: 0,
      description: 0,
      title: 0,
      url: 0,
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
      "description"
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
      "url"
    ],
    "message": "Expected string, received number"
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
    const data: CreateArmsLengthBodyRequest = {
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    service.create.mockResolvedValueOnce({
      success: false,
      errors: ['duplicateTitle', 'duplicateName', 'unknown'],
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
        ],
      },
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    const data: CreateArmsLengthBodyRequest = {
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
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
  const service = mockInstance(ArmsLengthBodyService);

  const handler = await testHelpers.getAutoServiceRef(create, [
    testHelpers.provideService(armsLengthBodyServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.post('/', handler));

  return { handler, app, service };
}
