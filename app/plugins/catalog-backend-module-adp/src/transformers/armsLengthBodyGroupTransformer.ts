import { GroupEntity } from '@backstage/catalog-model';
import { ArmsLengthBody } from '@internal/plugin-adp-common';
import { createTitle } from './utils';

export type ArmsLengthBodyGroupTransformer = (
  armsLengthBody: ArmsLengthBody,
) => Promise<GroupEntity | undefined>;

export const armsLengthBodyGroupTransformer: ArmsLengthBodyGroupTransformer =
  async (armsLengthBody): Promise<GroupEntity | undefined> => {
    const entity: GroupEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Group',
      metadata: {
        name: armsLengthBody.name,
        title: createTitle(armsLengthBody.title, armsLengthBody.short_name),
        tags: [],
        annotations: {
          'backstage.io/managed-by-location': `adp:arms-length-body\\${armsLengthBody.name}`,
          'backstage.io/managed-by-origin-location': `adp:arms-length-body\\${armsLengthBody.name}`,
        },
        links: [],
      },
      spec: {
        type: 'arms-length-body',
        children: [],
      },
    };

    if (armsLengthBody.description) {
      entity.metadata.description = armsLengthBody.description;
    }

    if (armsLengthBody.url) {
      entity.metadata.links?.push({
        url: armsLengthBody.url ? armsLengthBody.url : '',
      });
    }

    return entity;
  };
