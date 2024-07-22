import {
  AdpPage,
  AlbViewPage,
  DeliveryProgrammeViewPage,
  DeliveryProjectViewPage,
  EntityPageManageProgrammeAdminContent,
  adpPlugin,
} from './plugin';

describe('adp', () => {
  it('should export plugin', () => {
    expect(adpPlugin).toBeDefined();
  });

  it('should export AdpPage', () => {
    expect(AdpPage).toBeDefined();
  });

  it('should export AlbViewPage', () => {
    expect(AlbViewPage).toBeDefined();
  });

  it('should export DeliveryProgrammeViewPage', () => {
    expect(DeliveryProgrammeViewPage).toBeDefined();
  });

  it('should export DeliveryProjectViewPage', () => {
    expect(DeliveryProjectViewPage).toBeDefined();
  });

  it('should export EntityPageManageProgrammeAdminContent', () => {
    expect(EntityPageManageProgrammeAdminContent).toBeDefined();
  });
});
