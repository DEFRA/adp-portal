import { createParser } from '../../utils';
import { type DeleteDeliveryProjectUserRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { createEndpointRef } from '../util';
import { deliveryProjectUserServiceRef } from '../../services';

export default createEndpointRef({
  name: 'removeDeliveryProjectUser',
  deps: {
    service: deliveryProjectUserServiceRef,
  },
  factory({ deps: { service }, responses: { noContent } }) {
    const parseBody = createParser<DeleteDeliveryProjectUserRequest>(
      z.object({
        delivery_project_user_id: z.string(),
        delivery_project_id: z.string(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      await service.remove(body.delivery_project_user_id);
      return noContent();
    };
  },
});
