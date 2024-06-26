import type { GroupEntity } from '@backstage/catalog-model';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
} from '@backstage/catalog-model';
import {
  normalizeUsername,
  type DeliveryProgramme,
  type DeliveryProgrammeAdmin,
} from '@internal/plugin-adp-common';
import { createTransformerTitle } from './utils';
import { DELIVERY_PROGRAMME_ID_ANNOTATION } from './constants';

export type DeliveryProgrammeGroupTransformer = (
  deliveryProgramme: DeliveryProgramme,
  deliveryProgrammeAdmins: DeliveryProgrammeAdmin[],
) => Promise<GroupEntity | undefined>;

export const deliveryProgrammeGroupTransformer: DeliveryProgrammeGroupTransformer =
  async (
    deliveryProgramme,
    deliveryProgrammeAdmins,
  ): Promise<GroupEntity | undefined> => {
    const members = deliveryProgrammeAdmins.map(user =>
      normalizeUsername(user.email),
    );
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
          [DELIVERY_PROGRAMME_ID_ANNOTATION]: deliveryProgramme.id,
        },
        links: [],
      },
      spec: {
        type: 'delivery-programme',
        children: deliveryProgramme.children ?? [],
        members: members ?? [],
      },
    };

    if (deliveryProgramme.url) {
      entity.metadata.links?.push({
        url: deliveryProgramme.url,
      });
    }

    return entity;
  };
