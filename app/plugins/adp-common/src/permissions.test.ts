import {
  adpProgrammmeCreatePermission,
  adpProjectCreatePermission,
  deliveryProjectUserCreatePermission,
  adpPluginPermissions,
  deliveryProgrammeAdminCreatePermission,
  deliveryProjectUserUpdatePermission,
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

  describe('deliveryProgrammeAdminCreatePermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProgrammeAdminCreatePermission.attributes).toEqual({
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
      deliveryProgrammeAdminCreatePermission,
      deliveryProjectUserCreatePermission,
      deliveryProjectUserUpdatePermission,
    ];
    expect(adpPluginPermissions).toHaveLength(expectedPermissions.length);
    expectedPermissions.forEach(permission => {
      expect(adpPluginPermissions).toContain(permission);
    });
  });
});
