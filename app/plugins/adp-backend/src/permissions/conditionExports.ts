import { createConditionExports } from '@backstage/plugin-permission-node';
import { DELIVERY_PROJECT_RESOURCE_TYPE } from '@internal/plugin-adp-common';
import { permissionRules } from './rules';

const { conditions, createConditionalDecision } = createConditionExports({
  pluginId: 'adp',
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
  rules: permissionRules,
});

export const deliveryProjectConditions = conditions;
export const createDeliveryProjectConditionalDecision =
  createConditionalDecision;