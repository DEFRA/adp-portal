import { armsLengthBodyStoreRef } from '../../armsLengthBody';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
  },
  factory({ deps: { armsLengthBodyStore }, responses: { ok } }) {
    return async () => {
      const armsLengthBodies = await armsLengthBodyStore.getAll();
      const armsLengthBodiesNames = Object.fromEntries(
        armsLengthBodies.map(alb => [alb.id, alb.title]),
      );

      return ok().json(armsLengthBodiesNames);
    };
  },
});
