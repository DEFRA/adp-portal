import { createEndpointRef } from '../util';
import { createParser } from '../../utils';
import type { CreateArmsLengthBodyRequest } from '@internal/plugin-adp-common';
import { z } from 'zod';
import errorMapping from './errorMapping';
import { armsLengthBodyServiceRef } from '../../services';

export default createEndpointRef({
  name: 'createArmsLengthBody',
  deps: {
    service: armsLengthBodyServiceRef,
  },
  factory({ deps: { service }, responses: { created, validationErrors } }) {
    const parseBody = createParser<CreateArmsLengthBodyRequest>(
      z.object({
        title: z.string(),
        description: z.string(),
        alias: z.string().optional(),
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
