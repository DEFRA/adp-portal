import type {
  CreateDeliveryProjectRequest,
  DeliveryProject,
  UpdateDeliveryProjectRequest,
} from '@internal/plugin-adp-common';
import { createApiRef } from '@backstage/core-plugin-api';

export const deliveryProjectApiRef = createApiRef<DeliveryProjectApi>({
  id: 'plugin.adp.deliveryprojectapi',
});

export interface DeliveryProjectApi {
  getDeliveryProjects(): Promise<DeliveryProject[]>;
  getDeliveryProjectById(id: string): Promise<DeliveryProject>;
  updateDeliveryProject(
    data: UpdateDeliveryProjectRequest,
  ): Promise<DeliveryProject>;
  createDeliveryProject(
    data: CreateDeliveryProjectRequest,
  ): Promise<DeliveryProject>;
}
