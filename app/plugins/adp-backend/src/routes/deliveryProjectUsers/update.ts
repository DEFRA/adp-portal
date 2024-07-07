import { createParser } from '../../utils';
import { type UpdateDeliveryProjectUserRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { createEndpointRef } from '../util';
import { deliveryProjectUserServiceRef } from '../../services';
import { errorMapping } from './errorMapping';

export default createEndpointRef({
  name: 'updateDeliveryProjectUser',
  deps: {
    service: deliveryProjectUserServiceRef,
  },
  factory({ deps: { service }, responses: { ok, validationErrors } }) {
    const parseBody = createParser<UpdateDeliveryProjectUserRequest>(
      z.object({
        id: z.string(),
        delivery_project_id: z.string(),
        is_technical: z.boolean().optional(),
        is_admin: z.boolean().optional(),
        github_username: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const result = await service.edit(body.id, {
        github_username: body.github_username,
        is_admin: body.is_admin,
        is_technical: body.is_technical,
      });

      if (!result.success) {
        return validationErrors(
          result.errors,
          { unknown: errorMapping.unknown },
          body,
        );
      }

      return ok().json(result.value);
    };
  },
});
