import { createEndpointRef } from '../util';
import { entraIdApiRef } from '../../entraId';
import { type Request } from 'express';
import { type DeliveryProjectUser } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { createParser } from '../../utils';

export default createEndpointRef({
  name: 'createDeliveryProjectEntraGroups',
  deps: {
    entraIdApi: entraIdApiRef,
  },
  factory({ deps: { entraIdApi }, responses: { noContent } }) {
    const parseBody = createParser<DeliveryProjectUser[]>(
      z.array(
        z.object({
          aad_entity_ref_id: z.string(),
          delivery_project_id: z.string(),
          email: z.string(),
          id: z.string(),
          is_admin: z.boolean(),
          is_technical: z.boolean(),
          name: z.string(),
          updated_at: z
            .string()
            .datetime()
            .transform(value => new Date(value)),
          aad_user_principal_name: z.string().optional(),
          github_username: z.string().optional(),
          user_entity_ref: z.string().optional(),
        }),
      ),
    );

    return async (request: Request<{ projectName: string }>) => {
      const body = parseBody(request.body);
      await entraIdApi.createEntraIdGroupsForProjectIfNotExists(
        body,
        request.params.projectName,
      );
      return noContent();
    };
  },
});
