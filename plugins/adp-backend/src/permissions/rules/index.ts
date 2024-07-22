import { isDeliveryProgrammeAdmin } from './isDeliveryProgrammeAdmin';
import { isDeliveryProgrammeAdminForProject } from './isDeliveryProgrammeAdminForProject';
import { isDeliveryProjectAdmin } from './isDeliveryProjectAdmin';

export const deliveryProjectRules = {
  isDeliveryProjectAdmin,
  isDeliveryProgrammeAdminForProject,
};

export const deliveryProgrammeRules = {
  isDeliveryProgrammeAdmin,
};
