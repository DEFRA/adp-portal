import {
  adpProgrammmeCreatePermission,
  adpProjectCreatePermission,
  deliveryProjectUserCreatePermission,
  adpPluginPermissions,
  deliveryProgrammeAdminCreatePermission,
  deliveryProjectUserUpdatePermission,
  deliveryProgrammeAdminDeletePermission,
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

  describe('deliveryProgrammeAdminDeletePermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProgrammeAdminDeletePermission.attributes).toEqual({
        action: 'delete',
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
      deliveryProgrammeAdminDeletePermission,
      deliveryProjectUserCreatePermission,
      deliveryProjectUserUpdatePermission,
    ];
    expect(adpPluginPermissions).toHaveLength(expectedPermissions.length);
    expectedPermissions.forEach(permission => {
      expect(adpPluginPermissions).toContain(permission);
    });
  });
});
