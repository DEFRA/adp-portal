import create from './create';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  DeliveryProgramme,
  CreateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  DeliveryProgrammeService,
  deliveryProgrammeServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the service', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProgrammeRequest = {
      arms_length_body_id: randomUUID(),
      delivery_programme_code: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      alias: randomUUID(),
      url: randomUUID(),
    };
    const expected: DeliveryProgramme = {
      alias: randomUUID(),
      arms_length_body_id: randomUUID(),
      created_at: new Date(),
      delivery_programme_code: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
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

  it('Should accept all parameters as optional except title, description, delivery_programme_code, and arms_length_body_id', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProgrammeRequest = {
      arms_length_body_id: randomUUID(),
      delivery_programme_code: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
    };
    const expected: DeliveryProgramme = {
      alias: randomUUID(),
      arms_length_body_id: randomUUID(),
      created_at: new Date(),
      delivery_programme_code: randomUUID(),
      description: randomUUID(),
      id: randomUUID(),
      name: randomUUID(),
      title: randomUUID(),
      updated_at: new Date(),
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
      arms_length_body_id: 0,
      delivery_programme_code: 0,
      description: 0,
      title: 0,
      alias: 0,
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
      "arms_length_body_id"
    ],
    "message": "Expected string, received number"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "number",
    "path": [
      "delivery_programme_code"
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
    const data: CreateDeliveryProgrammeRequest = {
      arms_length_body_id: randomUUID(),
      delivery_programme_code: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      alias: randomUUID(),
      url: randomUUID(),
    };
    service.create.mockResolvedValueOnce({
      success: false,
      errors: [
        'duplicateTitle',
        'duplicateName',
        'unknown',
        'duplicateProgrammeCode',
        'unknownArmsLengthBody',
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
            path: 'delivery_programme_code',
            error: {
              message:
                'The programme code is already in use by another delivery programme.',
            },
          },
          {
            path: 'arms_length_body_id',
            error: { message: 'The arms length body does not exist.' },
          },
        ],
      },
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    const data: CreateDeliveryProgrammeRequest = {
      arms_length_body_id: randomUUID(),
      delivery_programme_code: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      alias: randomUUID(),
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
  const service = mockInstance(DeliveryProgrammeService);

  const handler = await testHelpers.getAutoServiceRef(create, [
    testHelpers.provideService(deliveryProgrammeServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.post('/', handler));

  return { handler, app, service };
}
