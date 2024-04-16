import { deliveryProgrammeGroupTransformer } from './deliveryProgrammeTransformers';
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
});
