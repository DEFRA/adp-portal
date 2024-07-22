import { AdoProjectApi, adoProjectApiRef } from '../../deliveryProject';
import { testHelpers } from '../../utils/testHelpers';
import checkAdoProject from './checkAdoProject';
import request from 'supertest';

describe('default', () => {
  it('Should call the api with the correct project name', async () => {
    const { app, service } = await setup();
    const expected = Math.random() > 0.5;
    service.checkIfAdoProjectExists.mockResolvedValueOnce(expected);

    const { status, body } = await request(app).get('/my-project');

    expect(service.checkIfAdoProjectExists).toHaveBeenCalledTimes(1);
    expect(service.checkIfAdoProjectExists).toHaveBeenCalledWith('my-project');
    expect({ status, body }).toMatchObject({
      status: 200,
      body: { exists: expected },
    });
  });
});

async function setup() {
  const service = mockInstance(AdoProjectApi);

  const handler = await testHelpers.getAutoServiceRef(checkAdoProject, [
    testHelpers.provideService(adoProjectApiRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.get('/:projectName', handler));

  return { handler, app, service };
}
