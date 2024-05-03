import {
  adpProgrammmeCreatePermission,
  adpProjectCreatePermission,
  adpProjectUserCreatePermission,
  adpPluginPermissions,
} from './permissions';

describe('Permissions', () => {
  describe('adpProgrammmeCreatePermission', () => {
    it('should have the correct attributes', () => {
      expect(adpProgrammmeCreatePermission.attributes).toEqual({
        action: 'create',
      });
    });
  });

  describe('adpProjectCreatePermission', () => {
    it('should have the correct attributes', () => {
      expect(adpProjectCreatePermission.attributes).toEqual({
        action: 'create',
      });
    });
  });

  describe('adpProjectUserCreatePermission', () => {
    it('should have the correct attributes', () => {
      expect(adpProjectUserCreatePermission.attributes).toEqual({
        action: 'create',
      });
    });
  });
});

describe('adpPluginPermissions', () => {
  it('should contain the correct permissions', () => {
    const expectedPermissions = [
      adpProgrammmeCreatePermission,
      adpProjectCreatePermission,
      adpProjectUserCreatePermission,
    ];
    expect(adpPluginPermissions).toHaveLength(expectedPermissions.length);
    expectedPermissions.forEach(permission => {
      expect(adpPluginPermissions).toContain(permission);
    });
  });
});
