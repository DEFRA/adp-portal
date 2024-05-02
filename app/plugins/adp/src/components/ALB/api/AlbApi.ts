import {
  ArmsLengthBody,
  CreateArmsLengthBodyRequest,
  UpdateArmsLengthBodyRequest,
} from '@internal/plugin-adp-common';
import { createApiRef } from '@backstage/core-plugin-api';

export const armsLengthBodyApiRef = createApiRef<ArmsLengthBodyApi>({
  id: 'plugin.adp.armslengthbodyapi',
});

export interface ArmsLengthBodyApi {
  getArmsLengthBodies(): Promise<ArmsLengthBody[]>;
  updateArmsLengthBody(
    data: UpdateArmsLengthBodyRequest,
  ): Promise<ArmsLengthBody[]>;
  createArmsLengthBody(
    data: CreateArmsLengthBodyRequest,
  ): Promise<ArmsLengthBody[]>;
  getArmsLengthBodyNames(): Promise<Record<string, string>>;
}
