import getAll from './getAll';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import { type DeliveryProject } from '@internal/plugin-adp-common';
import { randomUUID } from 'node:crypto';
import {
  DeliveryProjectService,
  deliveryProjectServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const expected = [...new Array(10)].map<DeliveryProject>(() => ({
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
    }));
    service.getAll.mockResolvedValueOnce(
      expected.map(x => ({ ...x, children: undefined })),
    );

    const { status, body } = await request(app).get(`/`);

    expect(service.getAll).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    service.getAll.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/`);

    expect(service.getAll).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProjectService);

  const handler = await testHelpers.getAutoServiceRef(getAll, [
    testHelpers.provideService(deliveryProjectServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.get('/', handler));

  return { handler, app, service };
}
