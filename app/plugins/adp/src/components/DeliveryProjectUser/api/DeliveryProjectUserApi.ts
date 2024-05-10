import type {
  CreateDeliveryProjectUserRequest,
  DeliveryProjectUser,
} from '@internal/plugin-adp-common';
import { createApiRef } from '@backstage/core-plugin-api';

export const deliveryProjectUserApiRef = createApiRef<DeliveryProjectUserApi>({
  id: 'plugin.adp.deliveryprojectuserapi',
});

export interface DeliveryProjectUserApi {
  getAll(): Promise<DeliveryProjectUser[]>;
  getByDeliveryProjectId(
    deliveryProjectId: string,
  ): Promise<DeliveryProjectUser[]>;
  create(data: CreateDeliveryProjectUserRequest): Promise<DeliveryProjectUser>;
}
