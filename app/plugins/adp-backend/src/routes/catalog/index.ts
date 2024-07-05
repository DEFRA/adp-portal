import { createRouterRef } from '../util';
import armsLengthBodies from './arms-length-bodies';
import deliveryProgrammes from './delivery-programmes';
import deliveryProjects from './delivery-projects';

export default createRouterRef({
  deps: {
    armsLengthBodies,
    deliveryProgrammes,
    deliveryProjects,
  },
  factory({ router, deps }) {
    router.use('/arms-length-bodies', deps.armsLengthBodies);
    router.use('/delivery-programmes', deps.deliveryProgrammes);
    router.use('/delivery-projects', deps.deliveryProjects);
  },
});
