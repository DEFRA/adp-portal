import { type IDeliveryProjectUserStore } from '../../deliveryProjectUser';
import { type IDeliveryProjectStore } from '../../deliveryProject';
import { type IDeliveryProgrammeAdminStore } from '../../deliveryProgrammeAdmin';
import { type DeliveryProject } from '@internal/plugin-adp-common';

export async function getDeliveryProject(
  deliveryProjectStore: IDeliveryProjectStore,
  deliveryProjectUserStore: IDeliveryProjectUserStore,
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore,
  deliveryProjectId: string,
): Promise<DeliveryProject> {
  const deliveryProject = await deliveryProjectStore.get(deliveryProjectId);
  const deliveryProjectUsers =
    await deliveryProjectUserStore.getByDeliveryProject(deliveryProjectId);
  const deliveryProgrammeAdmins =
    await deliveryProgrammeAdminStore.getByDeliveryProgramme(
      deliveryProject.delivery_programme_id,
    );

  deliveryProject.delivery_project_users = deliveryProjectUsers;
  deliveryProject.delivery_programme_admins = deliveryProgrammeAdmins;

  return deliveryProject;
}
