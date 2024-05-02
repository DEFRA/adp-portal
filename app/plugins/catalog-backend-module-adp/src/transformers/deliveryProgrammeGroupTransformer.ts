import { ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION, GroupEntity } from '@backstage/catalog-model';
import { DeliveryProgramme } from '@internal/plugin-adp-common';
import { createTransformerTitle } from './utils';
import { DELIVERY_PROGRAMME_ID_ANNOTATION } from './constants';

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
          [ANNOTATION_LOCATION]: `adp:delivery-programme\\${deliveryProgramme.name}`,
          [ANNOTATION_ORIGIN_LOCATION]: `adp:delivery-programme\\${deliveryProgramme.name}`,
          [DELIVERY_PROGRAMME_ID_ANNOTATION]: deliveryProgramme.id
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
