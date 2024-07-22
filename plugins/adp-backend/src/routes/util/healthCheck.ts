import { coreServices } from '@backstage/backend-plugin-api';
import { createEndpointRef } from './createEndpointRef';

export default createEndpointRef({
  name: 'healthCheck',
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
