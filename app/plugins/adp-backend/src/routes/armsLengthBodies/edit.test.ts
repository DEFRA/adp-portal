import edit from './edit';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  ArmsLengthBody,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  ArmsLengthBodyService,
  armsLengthBodyServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const data: UpdateArmsLengthBodyRequest = {
      id: randomUUID(),
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
      name: 'test-alb',
      owner: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      alias: randomUUID(),
      updated_by: randomUUID(),
      url: randomUUID(),
    };
    service.update.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should accept all parameters as optional except id', async () => {
    const { app, service } = await setup();
    const data: UpdateArmsLengthBodyRequest = {
      id: randomUUID(),
    };
    const expected: ArmsLengthBody = {
      created_at: new Date(),
      creator: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: 'test-alb',
      owner: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
      alias: randomUUID(),
      updated_by: randomUUID(),
      url: randomUUID(),
    };
    service.update.mockResolvedValueOnce({ success: true, value: expected });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(data);
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
      url: 0,
    };

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.update).toHaveBeenCalledTimes(0);
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
      "url"
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
    const data: UpdateArmsLengthBodyRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    service.update.mockResolvedValueOnce({
      success: false,
      errors: ['duplicateTitle', 'unknown'],
    });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(data);
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
        ],
      },
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    const data: UpdateArmsLengthBodyRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    service.update.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(data);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service = mockInstance(ArmsLengthBodyService);

  const handler = await testHelpers.getAutoServiceRef(edit, [
    testHelpers.provideService(armsLengthBodyServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.patch('/', handler));

  return { handler, app, service };
}
