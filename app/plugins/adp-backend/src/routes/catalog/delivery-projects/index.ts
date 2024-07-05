import { createRouterRef } from '../../util';
import getAllYaml from './getAll.yaml';
import getYaml from './get.yaml';
import health from './health';
import { middlewareFactoryRef } from '../../../refs';

export default createRouterRef({
  deps: {
    middleware: middlewareFactoryRef,
    getAllYaml,
    getYaml,
    health,
  },
  factory({ router, deps }) {
    router.get('/entity.yaml', deps.getAllYaml);
    router.get('/:name/entity.yaml', deps.getYaml);
    router.get('/health', deps.health);
    router.use(deps.middleware.error());
  },
});
