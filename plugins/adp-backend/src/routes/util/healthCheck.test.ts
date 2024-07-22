import { testHelpers } from '../../utils/testHelpers';
import request from 'supertest';
import { coreServices } from '@backstage/backend-plugin-api';
import healthCheck from './healthCheck';
import { mockServices } from '@backstage/backend-test-utils';

describe('default', () => {
  async function setup() {
    const logger = mockServices.logger.mock();

    const handler = await testHelpers.getAutoServiceRef(healthCheck, [
      testHelpers.provideService(coreServices.logger, logger),
    ]);

    const app = testHelpers.makeApp(x => x.get('/', handler));

    return { handler, app, logger };
  }

  it('Log pong and return 200 ok', async () => {
    const { app, logger } = await setup();

    const { status, body } = await request(app).get(`/`);

    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith('PONG!');
    expect({ status, body }).toMatchObject({
      status: 200,
      body: { status: 'ok' },
    });
  });
});
