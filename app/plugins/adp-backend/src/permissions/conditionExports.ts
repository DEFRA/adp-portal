import { createConditionExports } from '@backstage/plugin-permission-node';
import {
  DELIVERY_PROGRAMME_RESOURCE_TYPE,
  DELIVERY_PROJECT_RESOURCE_TYPE,
} from '@internal/plugin-adp-common';
import { deliveryProgrammeRules, deliveryProjectRules } from './rules';

const {
  conditions: projectConditions,
  createConditionalDecision: createProjectConditionalDecision,
} = createConditionExports({
  pluginId: 'adp',
  resourceType: DELIVERY_PROJECT_RESOURCE_TYPE,
  rules: deliveryProjectRules,
});

export const deliveryProjectConditions = projectConditions;
export const createDeliveryProjectConditionalDecision =
  createProjectConditionalDecision;

const {
  conditions: programmeConditions,
  createConditionalDecision: createProgrammeConditionalDecision,
} = createConditionExports({
  pluginId: 'adp',
  resourceType: DELIVERY_PROGRAMME_RESOURCE_TYPE,
  rules: deliveryProgrammeRules,
});

export const deliveryProgrammeConditions = programmeConditions;
export const createDeliveryProgrammeConditionalDecision =
  createProgrammeConditionalDecision;
