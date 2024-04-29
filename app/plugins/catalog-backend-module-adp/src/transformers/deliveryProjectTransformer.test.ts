import {
  deliveryProject,
  expectedProjectEntity,
} from '../testData/projectTransformerTestData';
import { deliveryProjectGroupTransformer } from './deliveryProjectTransformer';

describe('deliveryProjectGroupTransformer', () => {
  it('should transform a valid DeliveryProject to a GroupEntity', async () => {
    const result = await deliveryProjectGroupTransformer(deliveryProject);
    expect(result).toEqual(expectedProjectEntity);
  });
});
