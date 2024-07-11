import {
  ANNOTATION_EDIT_URL,
  ANNOTATION_VIEW_URL,
  type GroupEntity,
} from '@backstage/catalog-model';
import type { Request } from 'express';
import { createEndpointRef } from '../../util';
import { createTransformerTitle } from '../util';
import { armsLengthBodyStoreRef } from '../../../armsLengthBody';
import { coreServices } from '@backstage/backend-plugin-api';
import { ARMS_LENGTH_BODY_ID_ANNOTATION } from '@internal/plugin-adp-common';

export default createEndpointRef({
  name: 'getArmsLengthBodyEntityYaml',
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
    config: coreServices.rootConfig,
  },
  factory({ deps: { armsLengthBodyStore, config }, responses: { ok } }) {
    const baseUrl = `${config.getString('app.baseUrl')}/onboarding`;
    return async (request: Request<{ name: string }>) => {
      const entity = await armsLengthBodyStore.getByName(request.params.name);

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
            [ARMS_LENGTH_BODY_ID_ANNOTATION]: entity.id,
            [ANNOTATION_EDIT_URL]: `${baseUrl}/arms-length-bodies`,
            [ANNOTATION_VIEW_URL]: `${baseUrl}/arms-length-bodies`,
          },
        },
        spec: {
          type: 'arms-length-body',
          children: [],
        },
      } satisfies GroupEntity);
    };
  },
});
