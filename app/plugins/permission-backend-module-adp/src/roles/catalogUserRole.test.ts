import {
  catalogEntityDeletePermission,
  catalogEntityReadPermission,
  catalogEntityRefreshPermission,
  catalogLocationCreatePermission,
  catalogLocationDeletePermission,
  catalogLocationReadPermission,
} from '@backstage/plugin-catalog-common/alpha';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { catalogUserRole } from './catalogUserRole';

describe('catalogReaderRole', () => {
  it.each([
    {
      permission: catalogEntityReadPermission,
      expected: AuthorizeResult.ALLOW,
    },
    {
      permission: catalogLocationReadPermission,
      expected: AuthorizeResult.ALLOW,
    },
    {
      permission: catalogEntityRefreshPermission,
      expected: AuthorizeResult.ALLOW,
    },
    {
      permission: catalogLocationReadPermission,
      expected: AuthorizeResult.ALLOW,
    },
    {
      permission: catalogLocationCreatePermission,
      expected: AuthorizeResult.ALLOW,
    },
    {
      permission: catalogEntityDeletePermission,
      expected: AuthorizeResult.DENY,
    },
    {
      permission: catalogLocationDeletePermission,
      expected: AuthorizeResult.DENY,
    },
  ])(
    'should return the expected descision for the permission $permission.name',
    ({ permission, expected }) => {
      const result = catalogUserRole(permission);
      expect(result.result).toBe(expected);
    },
  );
});
