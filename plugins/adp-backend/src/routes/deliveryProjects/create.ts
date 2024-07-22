import { createEndpointRef } from '../util';
import { type CreateDeliveryProjectRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { createParser } from '../../utils';
import { deliveryProjectServiceRef } from '../../services';
import { errorMapping } from './errorMapping';

export default createEndpointRef({
  name: 'createDeliveryProject',
  deps: {
    service: deliveryProjectServiceRef,
  },
  factory({ deps: { service }, responses: { created, validationErrors } }) {
    const parseBody = createParser<CreateDeliveryProjectRequest>(
      z.object({
        title: z.string(),
        alias: z.string().optional(),
        description: z.string(),
        finance_code: z.string().optional(),
        delivery_programme_id: z.string(),
        delivery_project_code: z.string(),
        ado_project: z.string(),
        team_type: z.string(),
        service_owner: z.string(),
        github_team_visibility: z.enum(['public', 'private']),
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
