import { GroupEntity, ANNOTATION_LOCATION, ANNOTATION_ORIGIN_LOCATION } from '@backstage/catalog-model';
import { ArmsLengthBody } from '@internal/plugin-adp-common';
import { createTransformerTitle } from './utils';
import { ARMS_LENGTH_BODY_ID_ANNOTATION } from './constants';

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
        title: createTransformerTitle(
          armsLengthBody.title,
          armsLengthBody.alias,
        ),
        description: armsLengthBody.description,
        tags: [],
        annotations: {
          [ANNOTATION_LOCATION]: `adp:arms-length-body\\${armsLengthBody.name}`,
          [ANNOTATION_ORIGIN_LOCATION]: `adp:arms-length-body\\${armsLengthBody.name}`,
          [ARMS_LENGTH_BODY_ID_ANNOTATION]: armsLengthBody.id
        },
        links: [],
      },
      spec: {
        type: 'arms-length-body',
        children: armsLengthBody.children ?? [],
      },
    };

    if (armsLengthBody.url) {
      entity.metadata.links?.push({
        url: armsLengthBody.url
      });
    }

    return entity;
  };
