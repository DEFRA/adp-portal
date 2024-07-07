import {
  ANNOTATION_EDIT_URL,
  ANNOTATION_VIEW_URL,
  type GroupEntity,
} from '@backstage/catalog-model';
import type { Request } from 'express';
import { deliveryProgrammeStoreRef } from '../../../deliveryProgramme';
import { createEndpointRef } from '../../util';
import {
  DELIVERY_PROGRAMME_ID_ANNOTATION,
  createTransformerTitle,
} from '../util';
import { deliveryProgrammeAdminStoreRef } from '../../../deliveryProgrammeAdmin';
import { normalizeUsername } from '@internal/plugin-adp-common';
import { armsLengthBodyStoreRef } from '../../../armsLengthBody';
import { coreServices } from '@backstage/backend-plugin-api';

export default createEndpointRef({
  name: 'getDeliveryProgrammeEntityYaml',
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    deliveryProgrammeAdminStore: deliveryProgrammeAdminStoreRef,
    config: coreServices.rootConfig,
  },
  factory({
    deps: {
      deliveryProgrammeStore,
      deliveryProgrammeAdminStore,
      armsLengthBodyStore,
      config,
    },
    responses: { ok },
  }) {
    const baseUrl = `${config.getString('app.baseUrl')}/onboarding`;
    return async (request: Request<{ name: string }>) => {
      const entity = await deliveryProgrammeStore.getByName(
        request.params.name,
      );
      const parent = await armsLengthBodyStore.get(entity.arms_length_body_id);
      const children = await deliveryProgrammeAdminStore.getByDeliveryProgramme(
        entity.id,
      );

      return ok().yaml({
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Group',
        metadata: {
          name: entity.name,
          title: createTransformerTitle(entity.title, entity.alias),
          description: entity.description,
          tags: [],
          links: [...(entity.url ? [{ url: entity.url }] : [])],
          annotations: {
            [DELIVERY_PROGRAMME_ID_ANNOTATION]: entity.id,
            [ANNOTATION_EDIT_URL]: `${baseUrl}/delivery-programmes`,
            [ANNOTATION_VIEW_URL]: `${baseUrl}/delivery-programmes`,
          },
        },
        spec: {
          type: 'delivery-programme',
          parent: `group:default/${parent.name}`,
          members: children.map(m => normalizeUsername(m.email)),
          children: [],
        },
      } satisfies GroupEntity);
    };
  },
});
