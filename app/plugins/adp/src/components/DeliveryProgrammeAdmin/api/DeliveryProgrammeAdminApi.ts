import { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { createApiRef } from '@backstage/core-plugin-api';

export const deliveryProgrammeAdminApiRef =
  createApiRef<DeliveryProgrammeAdminApi>({
    id: 'plugin.adp.deliveryprogrammeadminapi',
  });

export interface DeliveryProgrammeAdminApi {
  getAll(): Promise<DeliveryProgrammeAdmin[]>;
  getByDeliveryProgrammeId(
    deliveryProgrammeId: string,
  ): Promise<DeliveryProgrammeAdmin[]>;
  create(data: any): Promise<DeliveryProgrammeAdmin[]>;
  delete(
    aadEntityRefId: string,
    deliveryProgrammeId: string,
  ): Promise<DeliveryProgrammeAdmin[]>;
}
