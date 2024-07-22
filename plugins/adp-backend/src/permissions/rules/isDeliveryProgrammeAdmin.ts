import type { DeliveryProgramme } from '@internal/plugin-adp-common';
import { DELIVERY_PROGRAMME_RESOURCE_TYPE } from '@internal/plugin-adp-common';
import { createDeliveryProgrammePermissionRule } from './utils';
import { z } from 'zod';

export const isDeliveryProgrammeAdmin = createDeliveryProgrammePermissionRule({
  name: 'IS_DELIVERY_PROGRAMME_ADMIN',
  description: 'Should only allow if the user is a Delivery Programme Admin',
  resourceType: DELIVERY_PROGRAMME_RESOURCE_TYPE,
  paramsSchema: z.object({
    userId: z.string().describe('ID of the user to check'),
  }),
  apply(resource: DeliveryProgramme, { userId }) {
    const programmeAdmin = resource.delivery_programme_admins?.find(
      user => user.user_entity_ref === userId,
    );

    return programmeAdmin !== undefined;
  },
  toQuery: () => ({}),
});
