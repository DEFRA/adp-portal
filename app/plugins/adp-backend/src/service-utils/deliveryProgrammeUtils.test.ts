import { NotFoundError } from '@backstage/errors';
import { catalogTestData } from '../testData/catalogEntityTestData';
import { getProgrammeManagerDetails } from './deliveryProgrammeUtils';

describe('getProgrammeManagerDetails', () => {
  it('returns the programme manager details', async () => {
    await expect(
      getProgrammeManagerDetails(
        'a9dc2414-0626-43d2-993d-a53aac4d73421',
        catalogTestData.items,
      ),
    ).resolves.toEqual({ email: 'test1.test@onmicrosoft.com', name: 'test1' });
  });

  it('returns error if name is not found', async () => {
    expect(
      getProgrammeManagerDetails(
        'a9dc2414-0626-43d2-993d-a53aac4d7341',
        catalogTestData.items,
      ),
    ).rejects.toThrow(NotFoundError);
  });
});