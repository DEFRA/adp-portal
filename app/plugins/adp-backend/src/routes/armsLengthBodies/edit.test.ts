import {
  type IArmsLengthBodyStore,
  armsLengthBodyStoreRef,
} from '../../armsLengthBody';
import edit from './edit';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type {
  ArmsLengthBody,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  type FireAndForgetCatalogRefresher,
  fireAndForgetCatalogRefresherRef,
} from '../../services';
import {
  type IdentityProvider,
  identityProviderRef,
} from '@internal/plugin-credentials-context-backend';

describe('default', () => {
  async function setup() {
    const catalog: jest.Mocked<FireAndForgetCatalogRefresher> = {
      refresh: jest.fn(),
    };
    const albs: jest.Mocked<IArmsLengthBodyStore> = {
      add: jest.fn(),
      get: jest.fn(),
      getAll: jest.fn(),
      update: jest.fn(),
      getByName: jest.fn(),
    };

    const identity: jest.Mocked<IdentityProvider> = {
      getCurrentIdentity: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(edit, [
      testHelpers.provideService(armsLengthBodyStoreRef, albs),
      testHelpers.provideService(identityProviderRef, identity),
      testHelpers.provideService(fireAndForgetCatalogRefresherRef, catalog),
    ]);

    const app = testHelpers.makeApp(x => x.patch('/', handler));

    return { handler, app, albs, identity, catalog };
  }

  it('Should return ok with the data from the store', async () => {
    const { app, albs, identity, catalog } = await setup();
    const username = randomUUID();
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
      children: [],
      updated_by: randomUUID(),
      url: randomUUID(),
    };
    albs.update.mockResolvedValueOnce({ success: true, value: expected });
    identity.getCurrentIdentity.mockResolvedValue({
      userEntityRef: username,
      ownershipEntityRefs: [],
    });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledWith(data, username);
    expect(catalog.refresh).toHaveBeenCalledTimes(1);
    expect(catalog.refresh).toHaveBeenCalledWith('group:default/test-alb');
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should accept all parameters as optional except id', async () => {
    const { app, albs, identity, catalog } = await setup();
    const username = randomUUID();
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
      children: [],
      updated_by: randomUUID(),
      url: randomUUID(),
    };
    albs.update.mockResolvedValueOnce({ success: true, value: expected });
    identity.getCurrentIdentity.mockResolvedValue({
      userEntityRef: username,
      ownershipEntityRefs: [],
    });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledWith(data, username);
    expect(catalog.refresh).toHaveBeenCalledTimes(1);
    expect(catalog.refresh).toHaveBeenCalledWith('group:default/test-alb');
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 400 if the request body is bad', async () => {
    const { app, albs, identity, catalog } = await setup();
    const data = {
      id: 0,
      alias: 0,
      description: 0,
      title: 0,
      url: 0,
    };

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(0);
    expect(albs.update).toHaveBeenCalledTimes(0);
    expect(catalog.refresh).toHaveBeenCalledTimes(0);
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
    const { app, albs, identity, catalog } = await setup();
    const username = randomUUID();
    const data: UpdateArmsLengthBodyRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    albs.update.mockResolvedValueOnce({
      success: false,
      errors: ['duplicateTitle', 'unknown'],
    });
    identity.getCurrentIdentity.mockResolvedValue({
      userEntityRef: username,
      ownershipEntityRefs: [],
    });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledWith(data, username);
    expect(catalog.refresh).toHaveBeenCalledTimes(0);
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

  it('Should return 500 if getIdentity fails', async () => {
    const { app, albs, identity, catalog } = await setup();
    const data: UpdateArmsLengthBodyRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    identity.getCurrentIdentity.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledTimes(0);
    expect(catalog.refresh).toHaveBeenCalledTimes(0);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });

  it('Should return 500 if update fails', async () => {
    const { app, albs, identity, catalog } = await setup();
    const username = randomUUID();
    const data: UpdateArmsLengthBodyRequest = {
      id: randomUUID(),
      alias: randomUUID(),
      description: randomUUID(),
      title: randomUUID(),
      url: randomUUID(),
    };
    albs.update.mockRejectedValueOnce(new Error());
    identity.getCurrentIdentity.mockResolvedValue({
      userEntityRef: username,
      ownershipEntityRefs: [],
    });

    const { status, body } = await request(app).patch(`/`).send(data);

    expect(identity.getCurrentIdentity).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledTimes(1);
    expect(albs.update).toHaveBeenCalledWith(data, username);
    expect(catalog.refresh).toHaveBeenCalledTimes(0);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});
