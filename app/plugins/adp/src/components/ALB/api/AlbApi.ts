import { ArmsLengthBody } from '@internal/plugin-adp-common';
import { createApiRef } from '@backstage/core-plugin-api';

export const armsLengthBodyApiRef = createApiRef<ArmsLengthBody>({
  id: 'plugin.adp.armslengthbodyapi',
});

export interface ArmsLengthBodyApi {
  getArmsLengthBodies(): Promise<ArmsLengthBody[]>;
  updateArmsLengthBody(data: any): Promise<ArmsLengthBody[]>;
  createArmsLengthBody(data: any): Promise<ArmsLengthBody[]>;
  getArmsLengthBodyNames(): Promise<Record<string,string>>
}
