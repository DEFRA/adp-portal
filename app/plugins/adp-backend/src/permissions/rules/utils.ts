import { makeCreatePermissionRule } from '@backstage/plugin-permission-node';
import type {
  DELIVERY_PROJECT_RESOURCE_TYPE,
  DeliveryProject,
} from '@internal/plugin-adp-common';

export const createDeliveryProjectPermissionRule = makeCreatePermissionRule<
  DeliveryProject,
  {},
  typeof DELIVERY_PROJECT_RESOURCE_TYPE
>();
