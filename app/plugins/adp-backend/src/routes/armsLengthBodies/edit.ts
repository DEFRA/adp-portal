import { createEndpointRef } from '../util';
import { createParser } from '../../utils';
import type { UpdateArmsLengthBodyRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import errorMapping from './errorMapping';
import { armsLengthBodyServiceRef } from '../../services';

export default createEndpointRef({
  name: 'editArmsLengthBody',
  deps: {
    service: armsLengthBodyServiceRef,
  },
  factory({ deps: { service }, responses: { ok, validationErrors } }) {
    const parseBody = createParser<UpdateArmsLengthBodyRequest>(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        alias: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
      }),
    );

    return async request => {
      const body = parseBody(request.body);
      const result = await service.update(body);
      if (!result.success)
        return validationErrors(result.errors, errorMapping, body);

      return ok().json(result.value);
    };
  },
});
