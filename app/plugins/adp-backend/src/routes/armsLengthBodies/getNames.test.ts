import getNames from './getNames';
import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import {
  ArmsLengthBodyService,
  armsLengthBodyServiceRef,
} from '../../services';

describe('default', () => {
  it('Should return ok with the data from the store', async () => {
    const { app, service } = await setup();
    const expected = {
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
      [randomUUID()]: randomUUID(),
    };
    service.getIdNameMap.mockResolvedValueOnce(expected);

    const { status, body } = await request(app).get(`/`);

    expect(service.getIdNameMap).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 200,
      body: JSON.parse(JSON.stringify(expected)),
    });
  });

  it('Should return 500 if an error is thrown', async () => {
    const { app, service } = await setup();
    service.getIdNameMap.mockRejectedValueOnce(new Error());

    const { status, body } = await request(app).get(`/`);

    expect(service.getIdNameMap).toHaveBeenCalledTimes(1);
    expect({ status, body }).toMatchObject({
      status: 500,
      body: { error: {} },
    });
  });
});

async function setup() {
  const service = mockInstance(ArmsLengthBodyService);

  const handler = await testHelpers.getAutoServiceRef(getNames, [
    testHelpers.provideService(armsLengthBodyServiceRef, service),
  ]);

  const app = testHelpers.makeApp(x => x.get('/', handler));

  return { handler, app, service };
}
