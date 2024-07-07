import type { DeliveryProjectTeamsSyncResult } from '@internal/plugin-adp-common';
import {
  DeliveryProjectGithubTeamsSyncronizer,
  deliveryProjectGithubTeamsSyncronizerRef,
} from '../../githubTeam';
import { testHelpers } from '../../utils/testHelpers';
import syncWithGithub from './syncWithGithub';
import request from 'supertest';
import { randomUUID } from 'node:crypto';

describe('default', () => {
  it('Should call the api with the correct project name', async () => {
    const { app, service } = await setup();
    const expected: DeliveryProjectTeamsSyncResult = {
      admins: {
        description: randomUUID(),
        id: Math.random(),
        isPublic: Math.random() > 0.5,
        maintainers: [randomUUID(), randomUUID(), randomUUID()],
        members: [randomUUID(), randomUUID(), randomUUID()],
        name: randomUUID(),
        slug: randomUUID(),
      },
      contributors: {
        description: randomUUID(),
        id: Math.random(),
        isPublic: Math.random() > 0.5,
        maintainers: [randomUUID(), randomUUID(), randomUUID()],
        members: [randomUUID(), randomUUID(), randomUUID()],
        name: randomUUID(),
        slug: randomUUID(),
      },
    };
    service.syncronizeByName.mockResolvedValueOnce(expected);

    const { status, body } = await request(app).put('/my-project');

    expect(service.syncronizeByName).toHaveBeenCalledTimes(1);
    expect(service.syncronizeByName).toHaveBeenCalledWith('my-project');
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });
});

async function setup() {
  const service = mockInstance(DeliveryProjectGithubTeamsSyncronizer);

  const handler = await testHelpers.getAutoServiceRef(syncWithGithub, [
    testHelpers.provideService(
      deliveryProjectGithubTeamsSyncronizerRef,
      service,
    ),
  ]);

  const app = testHelpers.makeApp(x => x.put('/:projectName', handler));

  return { handler, app, service };
}
