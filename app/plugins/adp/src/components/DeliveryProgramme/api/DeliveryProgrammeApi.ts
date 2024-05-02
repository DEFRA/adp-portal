import {
  CreateDeliveryProgrammeRequest,
  DeliveryProgramme,
  DeliveryProgrammeAdmin,
  UpdateDeliveryProgrammeRequest,
} from '@internal/plugin-adp-common';
import { createApiRef } from '@backstage/core-plugin-api';

export const deliveryProgrammeApiRef = createApiRef<DeliveryProgrammeApi>({
  id: 'plugin.adp.deliveryprogrammeapi',
});

export interface DeliveryProgrammeApi {
  getDeliveryProgrammes(): Promise<DeliveryProgramme[]>;
  getDeliveryProgrammeById(id: string): Promise<DeliveryProgramme>;
  updateDeliveryProgramme(
    data: UpdateDeliveryProgrammeRequest,
  ): Promise<DeliveryProgramme[]>;
  createDeliveryProgramme(
    data: CreateDeliveryProgrammeRequest,
  ): Promise<DeliveryProgramme[]>;
  getDeliveryProgrammeAdmins(): Promise<DeliveryProgrammeAdmin[]>;
}
