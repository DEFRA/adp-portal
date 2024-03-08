import { GroupEntity } from '@backstage/catalog-model';
import { DeliveryProgramme } from '@internal/plugin-adp-common';
import { createTransformerTitle } from '../utils';

export type GroupTransformer = (
  deliveryProgramme: DeliveryProgramme,
) => Promise<GroupEntity | undefined>;

export const defaultProgrammeGroupTransformer: GroupTransformer = async (
  deliveryProgramme,
): Promise<GroupEntity | undefined> => {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: deliveryProgramme.name,
      title: createTransformerTitle(deliveryProgramme.title, deliveryProgramme.alias),
      description: deliveryProgramme?.description,
      tags: [],
      annotations: {
        'backstage.io/managed-by-location': `adp:delivery-programme\\${deliveryProgramme.name}`,
        'backstage.io/managed-by-origin-location':
          '`adp:delivery-programme\\${deliveryProgramme.name}`',
      },
      links: [{ url: deliveryProgramme.url ? deliveryProgramme.url : '' }],
    },
    spec: {
      type: 'delivery-programme',
      children: [],
    },
  };
};
