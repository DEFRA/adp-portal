import { createParser } from '../../utils';
import { type DeleteDeliveryProgrammeAdminRequest } from '@internal/plugin-adp-common';
import { createEndpointRef } from '../util';
import { z } from 'zod';
import { deliveryProgrammeAdminServiceRef } from '../../services';

export default createEndpointRef({
  name: 'removeDeliveryProgrammeAdmin',
  deps: {
    service: deliveryProgrammeAdminServiceRef,
  },
  factory({ deps: { service }, responses: { noContent } }) {
    const parseBody = createParser<DeleteDeliveryProgrammeAdminRequest>(
      z.object({
        delivery_programme_admin_id: z.string(),
        group_entity_ref: z.string(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      await service.remove(body.delivery_programme_admin_id);
      return noContent();
    };
  },
});
