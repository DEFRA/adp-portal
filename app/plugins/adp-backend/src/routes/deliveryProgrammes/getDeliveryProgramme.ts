import { type IDeliveryProgrammeStore } from '../../deliveryProgramme';
import { type DeliveryProgramme } from '@internal/plugin-adp-common';
import { type IDeliveryProgrammeAdminStore } from '../../deliveryProgrammeAdmin';

export async function getDeliveryProgramme(
  deliveryProgrammeStore: IDeliveryProgrammeStore,
  deliveryProgrammeAdminStore: IDeliveryProgrammeAdminStore,
  deliveryProgrammeId: string,
): Promise<DeliveryProgramme> {
  const deliveryProgramme =
    await deliveryProgrammeStore.get(deliveryProgrammeId);
  const deliveryProgrammeAdmins =
    await deliveryProgrammeAdminStore.getByDeliveryProgramme(
      deliveryProgrammeId,
    );

  deliveryProgramme.delivery_programme_admins = deliveryProgrammeAdmins ?? [];

  return deliveryProgramme;
}
