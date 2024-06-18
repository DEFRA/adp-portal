import type {
  CreateDeliveryProjectUserRequest,
  DeliveryProjectUser,
  UpdateDeliveryProjectUserRequest,
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
  update(data: UpdateDeliveryProjectUserRequest): Promise<DeliveryProjectUser>;
  delete(
    deliveryProjectUserId: string,
    deliveryProjectId: string,
  ): Promise<void>;
}
