import { deliveryProgrammeAdminServiceRef } from '../../services';
import { createEndpointRef } from '../util';
import type { Request } from 'express';

export default createEndpointRef({
  name: 'getDeliveryProgrammeAdminsForDeliveryProgramme',
  deps: {
    service: deliveryProgrammeAdminServiceRef,
  },
  factory({ deps: { service }, responses: { ok } }) {
    return async (request: Request<{ deliveryProgrammeId: string }>) => {
      const result = await service.getByProgrammeId(
        request.params.deliveryProgrammeId,
      );
      return ok().json(result);
    };
  },
});
