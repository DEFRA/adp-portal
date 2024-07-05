import { createRouterRef, healthCheck } from '../../util';
import getAllYaml from './getAll.yaml';
import getYaml from './get.yaml';
import { middlewareFactoryRef } from '../../../refs';

export default createRouterRef({
  name: 'armsLengthBodyEntities',
  deps: {
    middleware: middlewareFactoryRef,
    getAllYaml,
    getYaml,
    healthCheck,
  },
  factory({ router, deps }) {
    router.get('/entity.yaml', deps.getAllYaml);
    router.get('/:name/entity.yaml', deps.getYaml);
    router.get('/health', deps.healthCheck);
    router.use(deps.middleware.error());
  },
});
