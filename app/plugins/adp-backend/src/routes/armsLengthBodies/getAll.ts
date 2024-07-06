import { armsLengthBodyServiceRef } from '../../services';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  name: 'getAllArmsLengthBodies',
  deps: {
    service: armsLengthBodyServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async () => {
      const data = await service.getAll();
      return ok().json(data);
    };
  },
});
