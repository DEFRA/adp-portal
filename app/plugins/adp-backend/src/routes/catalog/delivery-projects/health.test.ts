import health from './health';
import { testHelpers } from '../../../utils/testHelpers';
import request from 'supertest';
import {
  type LoggerService,
  coreServices,
} from '@backstage/backend-plugin-api';

describe('default', () => {
  async function setup() {
    const logger: jest.Mocked<LoggerService> = {
      child: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const handler = await testHelpers.getAutoServiceRef(health, [
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
