import {
  DeliveryProgramme,
  DeliveryProgrammeAdmin,
} from '@internal/plugin-adp-common';
import { createApiRef } from '@backstage/core-plugin-api';

export const DeliveryProgrammeApiRef = createApiRef<DeliveryProgramme>({
  id: 'plugin.adp.deliveryprogrammeapi',
});

export interface DeliveryProgrammeApi {
  getDeliveryProgrammes(): Promise<DeliveryProgramme[]>;
  getDeliveryProgrammeById(id: string): Promise<DeliveryProgramme>;
  updateDeliveryProgramme(data: any): Promise<DeliveryProgramme[]>;
  createDeliveryProgramme(data: any): Promise<DeliveryProgramme[]>;
  getDeliveryProgrammeAdmins(): Promise<DeliveryProgrammeAdmin[]>;
}
