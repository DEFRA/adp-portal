import { coreServices } from '@backstage/backend-plugin-api';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  deps: {
    logger: coreServices.logger,
  },
  factory({ responses, deps: { logger } }) {
    return () => {
      logger.info('PONG!');
      return responses.ok().json({ status: 'ok' });
    };
  },
});
