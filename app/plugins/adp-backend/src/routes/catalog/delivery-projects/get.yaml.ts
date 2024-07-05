import { type GroupEntity } from '@backstage/catalog-model';
import type { Request } from 'express';
import { deliveryProgrammeStoreRef } from '../../../deliveryProgramme';
import { createEndpointRef } from '../../util';
import {
  DELIVERY_PROJECT_ID_ANNOTATION,
  createTransformerTitle,
} from '../util';
import {
  deliveryProjectDisplayName,
  normalizeUsername,
} from '@internal/plugin-adp-common';
import { deliveryProjectStoreRef } from '../../../deliveryProject';
import { deliveryProjectUserStoreRef } from '../../../deliveryProjectUser';

export default createEndpointRef({
  deps: {
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    deliveryProjectStore: deliveryProjectStoreRef,
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
  },
  factory({
    deps: {
      deliveryProgrammeStore,
      deliveryProjectStore,
      deliveryProjectUserStore,
    },
    responses: { ok },
  }) {
    return async (request: Request<{ name: string }>) => {
      const entity = await deliveryProjectStore.getByName(request.params.name);
      const parent = await deliveryProgrammeStore.get(
        entity.delivery_programme_id,
      );
      const children = await deliveryProjectUserStore.getByDeliveryProject(
        entity.id,
      );

      return ok().yaml({
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Group',
        metadata: {
          name: entity.name,
          title: createTransformerTitle(
            deliveryProjectDisplayName(entity),
            entity.alias,
          ),
          description: entity.description,
          tags: [],
          links: [],
          annotations: {
            [DELIVERY_PROJECT_ID_ANNOTATION]: entity.id,
          },
        },
        spec: {
          type: 'delivery-project',
          parent: `group:default/${parent.name}`,
          members: children.map(m => normalizeUsername(m.email)),
          children: [],
        },
      } satisfies GroupEntity);
    };
  },
});
