import {
  armsLengthBody,
  expectedAlbEntity,
  expectedAlbEntityNoChild,
} from '../testData/albTransformerTestData';
import { armsLengthBodyGroupTransformer } from './armsLengthBodyGroupTransformer';

describe('armsLengthBodyGroupTransformer', () => {
  it('should transform a valid ArmsLengthBody to a GroupEntity', async () => {
    const result = await armsLengthBodyGroupTransformer(armsLengthBody);
    expect(result).toEqual(expectedAlbEntity);
  });

  it('should transform a valid ArmsLengthBody without children to a GroupEntity', async () => {
    const result = await armsLengthBodyGroupTransformer({
      ...armsLengthBody,
      children: [],
    });
    expect(result).toEqual(expectedAlbEntityNoChild);
  });

  it('should transform a valid ArmsLengthBody with children as undefined to a GroupEntity', async () => {
    const result = await armsLengthBodyGroupTransformer({
      ...armsLengthBody,
      children: undefined,
    });
    expect(result).toEqual(expectedAlbEntityNoChild);
  });
  
});
