import { GroupEntity } from '@backstage/catalog-model';
import { DeliveryProgramme } from '@internal/plugin-adp-common';
import { createTransformerTitle } from './utils';

export type DeliveryProgrammeGroupTransformer = (
  deliveryProgramme: DeliveryProgramme,
) => Promise<GroupEntity | undefined>;


export const deliveryProgrammeGroupTransformer: DeliveryProgrammeGroupTransformer =
  async (deliveryProgramme): Promise<GroupEntity | undefined> => {
    const entity: GroupEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Group',
      metadata: {
        name: deliveryProgramme.name,
        title: createTransformerTitle(
          deliveryProgramme.title,
          deliveryProgramme.alias,
        ),
        description: deliveryProgramme.description,
        tags: [],
        annotations: {
          'backstage.io/managed-by-location': `adp:delivery-programme\\${deliveryProgramme.name}`,
          'backstage.io/managed-by-origin-location': `adp:delivery-programme\\${deliveryProgramme.name}`,
        },
        links: [],
      },
      spec: {
        type: 'delivery-programme',
        children: deliveryProgramme.children ?? [],
      },
    };

    if (deliveryProgramme.url) {
      entity.metadata.links?.push({
        url: deliveryProgramme.url,
      });
    }

    return entity;
  };
