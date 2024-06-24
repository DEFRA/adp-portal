import {
  deliveryProgrammeCreatePermission,
  deliveryProjectCreatePermission,
  deliveryProjectUserCreatePermission,
  adpPluginPermissions,
  deliveryProgrammeAdminCreatePermission,
  deliveryProjectUserUpdatePermission,
  deliveryProgrammeAdminDeletePermission,
  deliveryProjectUserDeletePermission,
  armsLengthBodyCreatePermission,
  armsLengthBodyUpdatePermission,
  deliveryProgrammeUpdatePermission,
  deliveryProjectUpdatePermission,
} from './permissions';

describe('Permissions', () => {
  describe('armsLengthBodyCreatePermission', () => {
    it('should have the correct attributes', () => {
      expect(armsLengthBodyCreatePermission.attributes).toEqual({
        action: 'create',
      });
    });
  });

  describe('armsLengthBodyUpdatePermission', () => {
    it('should have the correct attributes', () => {
      expect(armsLengthBodyUpdatePermission.attributes).toEqual({
        action: 'update',
      });
    });
  });

  describe('deliveryProgrammeCreatePermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProgrammeCreatePermission.attributes).toEqual({
        action: 'create',
      });
    });
  });

  describe('deliveryProgrammeUpdatePermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProgrammeUpdatePermission.attributes).toEqual({
        action: 'update',
      });
    });
  });

  describe('adpProjectCreatePermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProjectCreatePermission.attributes).toEqual({
        action: 'create',
      });
    });
  });

  describe('adpProjectUpdatePermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProjectUpdatePermission.attributes).toEqual({
        action: 'update',
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

  describe('deliveryProjectUserCreatePermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProjectUserCreatePermission.attributes).toEqual({
        action: 'create',
      });
    });
  });

  describe('deliveryProjectUserEditPermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProjectUserUpdatePermission.attributes).toEqual({
        action: 'update',
      });
    });
  });

  describe('deliveryProjectUserDeletePermission', () => {
    it('should have the correct attributes', () => {
      expect(deliveryProjectUserDeletePermission.attributes).toEqual({
        action: 'delete',
      });
    });
  });
});

describe('adpPluginPermissions', () => {
  it('should contain the correct permissions', () => {
    const expectedPermissions = [
      armsLengthBodyCreatePermission,
      armsLengthBodyUpdatePermission,
      deliveryProgrammeCreatePermission,
      deliveryProgrammeUpdatePermission,
      deliveryProjectCreatePermission,
      deliveryProjectUpdatePermission,
      deliveryProgrammeAdminCreatePermission,
      deliveryProgrammeAdminDeletePermission,
      deliveryProjectUserCreatePermission,
      deliveryProjectUserUpdatePermission,
      deliveryProjectUserDeletePermission,
    ];
    expect(adpPluginPermissions).toHaveLength(expectedPermissions.length);
    expectedPermissions.forEach(permission => {
      expect(adpPluginPermissions).toContain(permission);
    });
  });
});
