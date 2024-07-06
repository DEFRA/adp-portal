import { createEndpointRef } from '../util';
import { type Request } from 'express';
import { deliveryProgrammeServiceRef } from '../../services';

export default createEndpointRef({
  name: 'getDeliveryProgramme',
  deps: {
    service: deliveryProgrammeServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async (request: Request<{ id: string }>) => {
      const data = await service.getById(request.params.id);
      return ok().json(data);
    };
  },
});
