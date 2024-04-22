import { NotFoundError } from '@backstage/errors';
import { catalogTestData } from '../testData/catalogEntityTestData';
import { getProjectUsersDetails } from './deliveryProjectUtils';

describe('getProjectUsersDetails', () => {
  it('returns the programme manager details', async () => {
    await expect(
      getProjectUsersDetails(
        'test1.test@onmicrosoft.com',
        catalogTestData.items,
      ),
    ).resolves.toEqual({ aad_entity_ref: 'a9dc2414-0626-43d2-993d-a53aac4d73421', name: 'test1', email: "test1.test@onmicrosoft.com", });
  });

  
  it('returns error if name is not found', async () => {
    expect(
      getProjectUsersDetails(
        'a9dc2414-0626-43d2-993d-a53aac4d7341',
        catalogTestData.items,
      ),
    ).rejects.toThrow(NotFoundError);
  });
});