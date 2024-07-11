import {
  ANNOTATION_EDIT_URL,
  ANNOTATION_VIEW_URL,
  type GroupEntity,
} from '@backstage/catalog-model';
import type { Request } from 'express';
import { deliveryProgrammeStoreRef } from '../../../deliveryProgramme';
import { createEndpointRef } from '../../util';
import { createTransformerTitle } from '../util';
import {
  DELIVERY_PROJECT_ADMIN_MEMBERS_ANNOTATION,
  DELIVERY_PROJECT_ID_ANNOTATION,
  DELIVERY_PROJECT_TECH_MEMBERS_ANNOTATION,
  deliveryProjectDisplayName,
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
            [DELIVERY_PROJECT_TECH_MEMBERS_ANNOTATION]: JSON.stringify(
              children
                .filter(c => c.is_technical)
                .map(m => normalizeUsername(m.email)),
            ),
            [DELIVERY_PROJECT_ADMIN_MEMBERS_ANNOTATION]: JSON.stringify(
              children
                .filter(c => c.is_admin)
                .map(m => normalizeUsername(m.email)),
            ),
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
