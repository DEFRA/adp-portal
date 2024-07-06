import { createEndpointRef } from '../util';
import { createParser } from '../../utils';
import { type CreateDeliveryProgrammeRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { errorMapping } from './errorMapping';
import { deliveryProgrammeServiceRef } from '../../services';

export default createEndpointRef({
  name: 'createDeliveryProgramme',
  deps: {
    service: deliveryProgrammeServiceRef,
  },
  factory({ deps: { service }, responses: { created, validationErrors } }) {
    const parseBody = createParser<CreateDeliveryProgrammeRequest>(
      z.object({
        title: z.string(),
        alias: z.string().optional(),
        description: z.string(),
        arms_length_body_id: z.string(),
        delivery_programme_code: z.string(),
        url: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const result = await service.create(body);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      return created().json(result.value);
    };
  },
});
