import {
  ANNOTATION_EDIT_URL,
  ANNOTATION_VIEW_URL,
  stringifyEntityRef,
  type GroupEntity,
} from '@backstage/catalog-model';
import type { Request } from 'express';
import { deliveryProgrammeStoreRef } from '../../../deliveryProgramme';
import { createEndpointRef } from '../../util';
import {
  DELIVERY_PROJECT_ID_ANNOTATION,
  createTransformerTitle,
} from '../util';
import {
  deliveryProjectDisplayName,
  type DeliveryProjectUser,
  normalizeUsername,
} from '@internal/plugin-adp-common';
import { deliveryProjectStoreRef } from '../../../deliveryProject';
import { deliveryProjectUserStoreRef } from '../../../deliveryProjectUser';
import { coreServices } from '@backstage/backend-plugin-api';

export default createEndpointRef({
  name: 'getDeliveryProjectEntityYaml',
  deps: {
    deliveryProgrammeStore: deliveryProgrammeStoreRef,
    deliveryProjectStore: deliveryProjectStoreRef,
    deliveryProjectUserStore: deliveryProjectUserStoreRef,
    config: coreServices.rootConfig,
  },
  factory({
    deps: {
      deliveryProgrammeStore,
      deliveryProjectStore,
      deliveryProjectUserStore,
      config,
    },
    responses: { ok },
  }) {
    const baseUrl = `${config.getString('app.baseUrl')}/onboarding`;
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
            [ANNOTATION_EDIT_URL]: `${baseUrl}/delivery-projects`,
            [ANNOTATION_VIEW_URL]: `${baseUrl}/delivery-projects`,
          },
        },
        relations: children.flatMap(c => [...getUserRelations(c)]),
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

function* getUserRelations(user: DeliveryProjectUser) {
  const targetRef = stringifyEntityRef({
    name: normalizeUsername(user.email),
    kind: 'user',
  });
  if (user.is_admin) yield { type: 'adp-hasAdminMember', targetRef };
  if (user.is_technical) yield { type: 'adp-hasTechnicalMember', targetRef };
}
