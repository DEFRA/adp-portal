import { GroupEntity } from '@backstage/catalog-model';
import { DeliveryProject } from '@internal/plugin-adp-common';
import { createTransformerTitle } from './utils';

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
          deliveryProject.title,
          deliveryProject.alias,
        ),
        description: deliveryProject.description,
        tags: [],
        annotations: {
          'backstage.io/managed-by-location': `adp:delivery-project\\${deliveryProject.name}`,
          'backstage.io/managed-by-origin-location': `adp:delivery-project\\${deliveryProject.name}`,
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
