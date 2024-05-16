import { deliveryProgrammeGroupTransformer } from './deliveryProgrammeGroupTransformer';
import {
  deliveryProgramme,
  deliveryProgrammeAdmins,
  expectedProgrammeEntity,
  expectedProgrammeEntityNoChild,
} from '../testData/programmeTransformerTestData';

describe('deliveryProgrammeGroupTransformer', () => {
  it('should transform a valid DeliveryProgramme with children to a GroupEntity', async () => {
    const result = await deliveryProgrammeGroupTransformer(
      deliveryProgramme,
      deliveryProgrammeAdmins,
    );
    expect(result).toEqual(expectedProgrammeEntity);
  });

  it('should transform a valid DeliveryProgramme without children to a GroupEntity', async () => {
    const result = await deliveryProgrammeGroupTransformer(
      {
        ...deliveryProgramme,
        children: [],
      },
      deliveryProgrammeAdmins,
    );
    expect(result).toEqual(expectedProgrammeEntityNoChild);
  });

  it('should transform a valid DeliveryProgramme with children undefined to a GroupEntity', async () => {
    const result = await deliveryProgrammeGroupTransformer(
      {
        ...deliveryProgramme,
        children: undefined,
      },
      deliveryProgrammeAdmins,
    );
    expect(result).toEqual(expectedProgrammeEntityNoChild);
  });
});
