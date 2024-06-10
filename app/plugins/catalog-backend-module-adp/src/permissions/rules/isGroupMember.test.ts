import type { GroupEntity } from '@backstage/catalog-model';
import { isGroupMemberRule } from './isGroupMember';

describe('isGroupMember', () => {
  describe('apply', () => {
    it('returns true when the user is a member of the group', () => {
      const group: GroupEntity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Group',
        metadata: {
          name: 'test-group',
        },
        spec: {
          children: [],
          type: 'team',
        },
        relations: [
          {
            targetRef: 'user:default/test-user',
            type: 'hasMember',
          },
        ],
      };

      expect(
        isGroupMemberRule.apply(group, { userRef: 'user:default/test-user' }),
      ).toBeTruthy();
    });

    it('returns false when the user is not a member of the group', () => {
      const group: GroupEntity = {
        apiVersion: 'backstage.io/v1beta1',
        kind: 'Group',
        metadata: {
          name: 'test-group',
        },
        spec: {
          children: [],
          type: 'team',
        },
      };

      expect(
        isGroupMemberRule.apply(group, { userRef: 'user:default/test-user' }),
      ).toBeFalsy();
    });
  });

  describe('toQuery', () => {
    it('returns an appropriate catalog-backend filter', () => {
      expect(
        isGroupMemberRule.toQuery({ userRef: 'user:default/test-user' }),
      ).toEqual({
        key: 'relations.hasMember',
        values: ['user:default/test-user'],
      });
    });
  });
});
