import { DeliveryProject } from '@internal/plugin-adp-common';
import { createApiRef } from '@backstage/core-plugin-api';

export const DeliveryProjectApiRef = createApiRef<DeliveryProject>({
  id: 'plugin.adp.deliveryprojectapi',
});

export interface DeliveryProjectApi {
  getDeliveryProjects(): Promise<DeliveryProject[]>;
  getDeliveryProjectById(id: string): Promise<DeliveryProject>;
  updateDeliveryProject(data: any): Promise<DeliveryProject>;
  createDeliveryProject(data: any): Promise<DeliveryProject>;
}
