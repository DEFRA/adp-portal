import { GroupEntity } from '@backstage/catalog-model';
import {DeliveryProgramme} from '../types/datamodel'

export type GroupTransformer = (
  deliveryProgramme: DeliveryProgramme
) => Promise<GroupEntity | undefined>;


export const defaultGroupTransformer: GroupTransformer = async (
  deliveryProgramme
): Promise<GroupEntity | undefined> => {

  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: deliveryProgramme.name,
      title: deliveryProgramme.title,
      description: deliveryProgramme?.description,
      tags: [],
      annotations: {
        'backstage.io/managed-by-location': `adp:delivery-programme\\${deliveryProgramme.name}`,
        'backstage.io/managed-by-origin-location': '`adp:delivery-programme\\${deliveryProgramme.name}`',
      }
    },
    spec: {
      type: 'delivery-programme',
      parent: deliveryProgramme?.armLengthBody,
      children: [],
    },
  };
};
