import edit from './edit';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  DeliveryProgramme,
  UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  DeliveryProgrammeService,
  deliveryProgrammeServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProgrammeRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
      arms_length_body_id: randomUUID(),
      delivery_programme_code: randomUUID(),
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
    const data: UpdateDeliveryProgrammeRequest = {
      id: randomUUID(),
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
      url: 0,
      arms_length_body_id: 0,
      delivery_programme_code: 0,
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
        request: { method: 'PATCH', url: '/' },
        response: { statusCode: 400 },
      },
    });
  });

  it('Should return 400 if the update fails', async () => {
    const { app, service } = await setup();
    const data: UpdateDeliveryProgrammeRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
      arms_length_body_id: randomUUID(),
      delivery_programme_code: randomUUID(),
    };
    service.edit.mockResolvedValueOnce({
      success: false,
      errors: [
        'duplicateTitle',
        'unknown',
        'duplicateProgrammeCode',
        'unknownArmsLengthBody',
      ],
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
    const data: UpdateDeliveryProgrammeRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
      arms_length_body_id: randomUUID(),
      delivery_programme_code: randomUUID(),
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
  const service = mockInstance(DeliveryProgrammeService);

  const handler = await testHelpers.getAutoServiceRef(edit, [
    testHelpers.provideService(deliveryProgrammeServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.patch('/', handler));

  return { handler, app, service };
}
