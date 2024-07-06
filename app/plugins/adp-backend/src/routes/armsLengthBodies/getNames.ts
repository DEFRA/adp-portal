import { armsLengthBodyServiceRef } from '../../services';
import { createEndpointRef } from '../util';

export default createEndpointRef({
  name: 'getAllArmsLengthBodyNames',
  deps: {
    service: armsLengthBodyServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async () => {
      const data = await service.getIdNameMap();
      return ok().json(data);
    };
  },
});
