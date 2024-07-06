import { createParser } from '../../utils';
import { type CreateDeliveryProgrammeAdminRequest } from '@internal/plugin-adp-common';
import { createEndpointRef } from '../util';
import { z } from 'zod';
import { errorMapping } from './errorMapping';
import { deliveryProgrammeAdminServiceRef } from '../../services';
import { stringifyEntityRef } from '@backstage/catalog-model';

export default createEndpointRef({
  name: 'addDeliveryProgrammeAdmin',
  deps: {
    service: deliveryProgrammeAdminServiceRef,
  },
  factory({ deps: { service }, responses: { validationErrors, created } }) {
    const parseBody = createParser<CreateDeliveryProgrammeAdminRequest>(
      z.object({
        delivery_programme_id: z.string().uuid(),
        user_catalog_name: z.string(),
        group_entity_ref: z.string(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const ref = stringifyEntityRef({
        kind: 'user',
        name: body.user_catalog_name,
      });
      const result = await service.add(body.delivery_programme_id, ref);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      return created().json(result.value);
    };
  },
});
