import { GroupEntity } from '@backstage/catalog-model';
import { ArmsLengthBody } from '@internal/plugin-adp-common';
import { createTransformerTitle } from '../utils';

export type GroupTransformer = (
  armslenghBody: ArmsLengthBody,
) => Promise<GroupEntity | undefined>;

export const defaultAlbGroupTransformer: GroupTransformer = async (
  armsLengthBody,
): Promise<GroupEntity | undefined> => {
  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: armsLengthBody.name,
      title: createTransformerTitle(armsLengthBody.title, armsLengthBody.alias),
      description: armsLengthBody?.description,
      tags: [],
      annotations: {
        'backstage.io/managed-by-location': `adp:arms-length-body\\${armsLengthBody.name}`,
        'backstage.io/managed-by-origin-location':
          '`adp:arms-length-body\\${armsLengthBody.name}`',
      },
      links: [{ url: armsLengthBody.url ? armsLengthBody.url : '' }],
    },
    spec: {
      type: 'arms-length-body',
      children: [],
    },
  };
};
