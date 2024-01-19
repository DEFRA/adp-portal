import { GroupEntity } from '@backstage/catalog-model';
import {ArmsLengthBody} from '../types/datamodel'

export type GroupTransformer = (
  armsl: ArmsLengthBody
) => Promise<GroupEntity | undefined>;


export const defaultGroupTransformer: GroupTransformer = async (
  armsLengthBody
): Promise<GroupEntity | undefined> => {

  return {
    apiVersion: 'backstage.io/v1beta1',
    kind: 'Group',
    metadata: {
      name: armsLengthBody.name,
      displayName: armsLengthBody?.short_name,
      description: armsLengthBody?.description,
      tags: [],
      annotations: {
        'backstage.io/managed-by-location': `adp:arms-length-body\\${armsLengthBody.name}`,
        'backstage.io/managed-by-origin-location': '`adp:arms-length-body\\${armsLengthBody.name}`',
      }
    },
    spec: {
      type: 'arms-length-body',
      children: [],
    },
  };
};