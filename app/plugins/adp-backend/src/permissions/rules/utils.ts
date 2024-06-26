import { makeCreatePermissionRule } from '@backstage/plugin-permission-node';
import {
  type DELIVERY_PROGRAMME_RESOURCE_TYPE,
  type DeliveryProgramme,
  type DELIVERY_PROJECT_RESOURCE_TYPE,
  type DeliveryProject,
} from '@internal/plugin-adp-common';

export const createDeliveryProjectPermissionRule = makeCreatePermissionRule<
  DeliveryProject,
  {},
  typeof DELIVERY_PROJECT_RESOURCE_TYPE
>();

export const createDeliveryProgrammePermissionRule = makeCreatePermissionRule<
  DeliveryProgramme,
  {},
  typeof DELIVERY_PROGRAMME_RESOURCE_TYPE
>();
