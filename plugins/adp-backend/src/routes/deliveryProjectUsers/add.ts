import { createParser } from '../../utils';
import { type CreateDeliveryProjectUserRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { createEndpointRef } from '../util';
import { deliveryProjectUserServiceRef } from '../../services';
import { errorMapping } from './errorMapping';

export default createEndpointRef({
  name: 'addDeliveryProjectUser',
  deps: {
    service: deliveryProjectUserServiceRef,
  },
  factory({ deps: { service }, responses: { created, validationErrors } }) {
    const parseBody = createParser<CreateDeliveryProjectUserRequest>(
      z.object({
        user_catalog_name: z.string(),
        delivery_project_id: z.string(),
        is_admin: z.boolean(),
        is_technical: z.boolean(),
        github_username: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const ref = stringifyEntityRef({
        kind: 'user',
        name: body.user_catalog_name,
      });
      const result = await service.add(body.delivery_project_id, ref, {
        is_admin: body.is_admin,
        is_technical: body.is_technical,
        github_username: body.github_username,
      });

      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      return created().json(result.value);
    };
  },
});
