import { deliveryProgrammeGroupTransformer } from './deliveryProgrammeGroupTransformer';
import {
  deliveryProgramme,
  expectedProgrammeEntity,
  expectedProgrammeEntityNoChild,
} from '../testData/programmeTransformerTestData';

describe('deliveryProgrammeGroupTransformer', () => {
  it('should transform a valid DeliveryProgramme with children to a GroupEntity', async () => {
    const result = await deliveryProgrammeGroupTransformer(deliveryProgramme);
    expect(result).toEqual(expectedProgrammeEntity);
  });

  it('should transform a valid DeliveryProgramme without children to a GroupEntity', async () => {
    const result = await deliveryProgrammeGroupTransformer({
      ...deliveryProgramme,
      children: [],
    });
    expect(result).toEqual(expectedProgrammeEntityNoChild);
  });

  it('should transform a valid DeliveryProgramme with children undefined to a GroupEntity', async () => {
    const result = await deliveryProgrammeGroupTransformer({
      ...deliveryProgramme,
      children: undefined,
    });
    expect(result).toEqual(expectedProgrammeEntityNoChild);
  });
});
