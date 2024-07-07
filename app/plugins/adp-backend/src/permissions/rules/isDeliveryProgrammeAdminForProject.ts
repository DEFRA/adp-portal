import type { DeliveryProject } from '@internal/plugin-adp-common';
import { DELIVERY_PROJECT_RESOURCE_TYPE } from '@internal/plugin-adp-common';
import { z } from 'zod';
import { createDeliveryProjectPermissionRule } from './utils';

export const isDeliveryProgrammeAdminForProject =
  createDeliveryProjectPermissionRule({
    name: 'IS_DELIVERY_PROGRAMME_ADMIN_FOR_PROJECT',
    description:
      'Should only allow if the user is a Delivery Programme Admin covering this delivery project',
    resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
    paramsSchema: z.object({
      userId: z.string().describe('ID of the user to check'),
    }),
    apply(resource: DeliveryProject, { userId }) {
      const projectUser = resource.delivery_programme_admins?.find(
        user => user.user_entity_ref === userId,
      );

      return projectUser !== undefined;
    },
    toQuery: () => ({}),
  });
