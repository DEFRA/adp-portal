import type { DeliveryProject } from '@internal/plugin-adp-common';
import { DELIVERY_PROJECT_RESOURCE_TYPE } from '@internal/plugin-adp-common';
import { createDeliveryProjectPermissionRule } from './utils';
import { z } from 'zod';

export const isDeliveryProjectAdmin = createDeliveryProjectPermissionRule({
  name: 'IS_DELIVERY_PROJECT_ADMIN',
  description: 'Should only allow if the user is a Delivery Project Admin',
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
  paramsSchema: z.object({
    userId: z.string().describe('ID of the user to check'),
  }),
  apply(resource: DeliveryProject, { userId }) {
    if (!resource.delivery_project_users) return false;
    // TODO: Need to store Backstage user ref in Project Users table.
    const projectUser = resource.delivery_project_users.find(
      user => user.aad_user_principal_name === userId,
    );

    return projectUser !== undefined && projectUser.is_admin;
  },
  toQuery: () => ({}),
});
