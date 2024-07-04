import {
  type IArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../armsLengthBody';
import create from './create';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  ArmsLengthBody,
  CreateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import type { IdentityApi } from '@backstage/plugin-auth-node';
import { authIdentityRef } from '../../refs';
import { coreServices } from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';

describe('default', () => {
  async function setup() {
    const albs: jest.Mocked<IArmsLengthBodyStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
    };

    const identity: jest.Mocked<IdentityApi> = {
      getIdentity: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(create, [
      testHelpers.provideService(armsLengthBodyStoreRef, albs),
      testHelpers.provideService(authIdentityRef, identity),
      testHelpers.provideService(
        coreServices.rootConfig,
        mockServices.rootConfig({
          data: {
            rbac: {
              programmeAdminGroup: 'test-admin-group',
            },
          },
        }),
      ),
    ]);

    const app = testHelpers.makeApp(x => x.post('/', handler));

    return { handler, app, albs, identity };
  }

  it('Should return ok with the data from the store', async () => {
    const { app, albs, identity } = await setup();
    const username = randomUUID();
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
      children: [],
      updated_by: randomUUID(),
      url: randomUUID(),
    };
    albs.add.mockResolvedValueOnce({ success: true, value: expected });
    identity.getIdentity.mockResolvedValue({
      identity: {
        userEntityRef: username,
        ownershipEntityRefs: [],
        type: 'user',
      },
      token: randomUUID(),
    });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(identity.getIdentity).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledWith(data, username, 'test-admin-group');
    expect({ status, body }).toMatchObject({
      status: 201,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should accept all parameters as optional except title and description', async () => {
    const { app, albs, identity } = await setup();
    const username = randomUUID();
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
      children: [],
      updated_by: randomUUID(),
      url: randomUUID(),
    };
    albs.add.mockResolvedValueOnce({ success: true, value: expected });
    identity.getIdentity.mockResolvedValue({
      identity: {
        userEntityRef: username,
        ownershipEntityRefs: [],
        type: 'user',
      },
      token: randomUUID(),
    });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(identity.getIdentity).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledWith(data, username, 'test-admin-group');
    expect({ status, body }).toMatchObject({
      status: 201,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 400 if the request body is bad', async () => {
    const { app, albs, identity } = await setup();
    const data = {
      alias: 0,
      description: 0,
      title: 0,
      url: 0,
    };

    const { status, body } = await request(app).post(`/`).send(data);

    expect(identity.getIdentity).toHaveBeenCalledTimes(0);
    expect(albs.add).toHaveBeenCalledTimes(0);
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

  it('Should return 400 if the.add fails', async () => {
    const { app, albs, identity } = await setup();
    const username = randomUUID();
    const data: CreateArmsLengthBodyRequest = {
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    albs.add.mockResolvedValueOnce({
      success: false,
      errors: ['duplicateTitle', 'duplicateName', 'unknown'],
    });
    identity.getIdentity.mockResolvedValue({
      identity: {
        userEntityRef: username,
        ownershipEntityRefs: [],
        type: 'user',
      },
      token: randomUUID(),
    });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(identity.getIdentity).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledWith(data, username, 'test-admin-group');
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

  it('Should return 500 if getIdentity fails', async () => {
    const { app, albs, identity } = await setup();
    const data: CreateArmsLengthBodyRequest = {
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    identity.getIdentity.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).post(`/`).send(data);

    expect(identity.getIdentity).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledTimes(0);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });

  it('Should return 500 if.add fails', async () => {
    const { app, albs, identity } = await setup();
    const username = randomUUID();
    const data: CreateArmsLengthBodyRequest = {
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    albs.add.mockRejectedValueOnce(new Error());
    identity.getIdentity.mockResolvedValue({
      identity: {
        userEntityRef: username,
        ownershipEntityRefs: [],
        type: 'user',
      },
      token: randomUUID(),
    });

    const { status, body } = await request(app).post(`/`).send(data);

    expect(identity.getIdentity).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledTimes(1);
    expect(albs.add).toHaveBeenCalledWith(data, username, 'test-admin-group');
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});
