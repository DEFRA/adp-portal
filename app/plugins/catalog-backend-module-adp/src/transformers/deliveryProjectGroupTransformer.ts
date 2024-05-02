import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  GroupEntity,
} from '@backstage/catalog-model';
import {
  DeliveryProject,
  deliveryProjectDisplayName,
} from '@internal/plugin-adp-common';
import { createTransformerTitle } from './utils';
import { DELIVERY_PROJECT_ID_ANNOTATION } from './constants';

export type DeliveryProjectGroupTransformer = (
  deliveryProject: DeliveryProject,
) => Promise<GroupEntity | undefined>;

export const deliveryProjectGroupTransformer: DeliveryProjectGroupTransformer =
  async (deliveryProject): Promise<GroupEntity | undefined> => {
    const entity: GroupEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Group',
      metadata: {
        name: deliveryProject.name,
        title: createTransformerTitle(
          deliveryProjectDisplayName(deliveryProject),
          deliveryProject.alias,
        ),
        description: deliveryProject.description,
        tags: [],
        annotations: {
          [ANNOTATION_LOCATION]: `adp:delivery-project\\${deliveryProject.name}`,
          [ANNOTATION_ORIGIN_LOCATION]: `adp:delivery-project\\${deliveryProject.name}`,
          [DELIVERY_PROJECT_ID_ANNOTATION]: deliveryProject.id,
        },
        links: [],
      },
      spec: {
        type: 'delivery-project',
        children: [],
      },
    };

    return entity;
  };
