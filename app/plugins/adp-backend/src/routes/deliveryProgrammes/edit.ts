import { createEndpointRef } from '../util';
import { createParser } from '../../utils';
import { type UpdateDeliveryProgrammeRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { errorMapping } from './errorMapping';
import { deliveryProgrammeServiceRef } from '../../services';

export default createEndpointRef({
  name: 'editDeliveryProgramme',
  deps: {
    service: deliveryProgrammeServiceRef,
  },
  factory({ deps: { service }, responses: { ok, validationErrors } }) {
    const parseBody = createParser<UpdateDeliveryProgrammeRequest>(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        alias: z.string().optional(),
        description: z.string().optional(),
        arms_length_body_id: z.string().optional(),
        delivery_programme_code: z.string().optional(),
        url: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const result = await service.edit(body);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      return ok().json(result.value);
    };
  },
});
