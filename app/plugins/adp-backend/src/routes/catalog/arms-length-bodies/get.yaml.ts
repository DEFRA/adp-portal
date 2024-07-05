import type { GroupEntity } from '@backstage/catalog-model';
import type { Request } from 'express';
import { createEndpointRef } from '../../util';
import {
  ARMS_LENGTH_BODY_ID_ANNOTATION,
  createTransformerTitle,
} from '../util';
import { armsLengthBodyStoreRef } from '../../../armsLengthBody';

export default createEndpointRef({
  deps: {
    armsLengthBodyStore: armsLengthBodyStoreRef,
  },
  factory({ deps: { armsLengthBodyStore }, responses: { ok } }) {
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
