import { createEndpointRef } from '../util';
import { type UpdateDeliveryProjectRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { createParser } from '../../utils';
import { deliveryProjectServiceRef } from '../../services';
import { errorMapping } from './errorMapping';

export default createEndpointRef({
  name: 'updateDeliveryProject',
  deps: {
    service: deliveryProjectServiceRef,
  },
  factory({ deps: { service }, responses: { ok, validationErrors } }) {
    const parseBody = createParser<UpdateDeliveryProjectRequest>(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        alias: z.string().optional(),
        description: z.string().optional(),
        finance_code: z.string().optional(),
        delivery_programme_id: z.string().optional(),
        delivery_project_code: z.string().optional(),
        ado_project: z.string().optional(),
        team_type: z.string().optional(),
        service_owner: z.string().optional(),
        github_team_visibility: z.enum(['public', 'private']).optional(),
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
