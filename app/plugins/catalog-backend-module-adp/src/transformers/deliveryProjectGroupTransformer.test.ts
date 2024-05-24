import {
  deliveryProject,
  deliveryProjectUsers,
  expectedProjectEntity,
} from '../testData/projectTransformerTestData';
import { deliveryProjectGroupTransformer } from './deliveryProjectGroupTransformer';

describe('deliveryProjectGroupTransformer', () => {
  it('should transform a valid DeliveryProject to a GroupEntity', async () => {
    const result = await deliveryProjectGroupTransformer(
      deliveryProject,
      deliveryProjectUsers,
    );
    expect(result).toEqual(expectedProjectEntity);
  });
});
