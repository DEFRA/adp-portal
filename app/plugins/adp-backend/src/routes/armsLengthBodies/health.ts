import { coreServices } from '@backstage/backend-plugin-api';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  deps: {
    logger: coreServices.logger,
  },
  factory({ deps: { logger }, responses: { ok } }) {
    return () => {
      logger.info('PONG!');
      return ok().json({ status: 'ok' });
    };
  },
});
