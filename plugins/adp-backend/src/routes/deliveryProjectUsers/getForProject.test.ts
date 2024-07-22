import getForProject from './getForProject';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  DeliveryProjectUserService,
  deliveryProjectUserServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const expected = [...new Array(10)].map<DeliveryProjectUser>(() => ({
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
    service.getByProjectId.mockResolvedValueOnce(
      expected.map(x => ({ ...x, children: undefined })),
    );

    const { status, body } = await request(app).get(`/abc`);

    expect(service.getByProjectId).toHaveBeenCalledTimes(1);
    expect(service.getByProjectId).toHaveBeenCalledWith('abc');
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    service.getByProjectId.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/abc`);

    expect(service.getByProjectId).toHaveBeenCalledTimes(1);
    expect(service.getByProjectId).toHaveBeenCalledWith('abc');
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProjectUserService);

  const handler = await testHelpers.getAutoServiceRef(getForProject, [
    testHelpers.provideService(deliveryProjectUserServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.get('/:deliveryProjectId', handler));

  return { handler, app, service };
}
