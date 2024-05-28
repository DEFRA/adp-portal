import type { GroupEntity } from '@backstage/catalog-model';
import { RELATION_HAS_MEMBER } from '@backstage/catalog-model';
import { createCatalogPermissionRule } from '@backstage/plugin-catalog-backend/alpha';
import { createConditionFactory } from '@backstage/plugin-permission-node';
import { z } from 'zod';

export const isGroupMemberRule = createCatalogPermissionRule({
  name: 'IS_GROUP_MEMBER',
  description: 'Checks if a group contains a specified member',
  resourceType: 'catalog-entity',
  paramsSchema: z.object({
    userRef: z.string(),
  }),
  apply: (resource: GroupEntity, { userRef }) => {
    if (!resource.relations) {
      return false;
    }

    return resource.relations
      .filter(relation => relation.type === RELATION_HAS_MEMBER)
      .some(relation => relation.targetRef === userRef);
  },
  toQuery: ({ userRef }) => ({
    key: 'relations.hasMember',
    values: [userRef],
  }),
});

export const isGroupMember = createConditionFactory(isGroupMemberRule);
