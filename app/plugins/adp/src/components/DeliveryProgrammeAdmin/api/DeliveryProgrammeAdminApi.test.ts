import { createApiRef } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  createApiRef: jest.fn().mockReturnValue({ id: 'mockedApiRef' }),
}));

describe('deliveryProgrammeAdminApiRef', () => {
  it('should create an API reference with the correct id', async () => {
    const { deliveryProgrammeAdminApiRef } = await import('./DeliveryProgrammeAdminApi');
    expect(createApiRef).toHaveBeenCalledWith({
      id: 'plugin.adp.deliveryprogrammeadminapi',
    });

    expect(deliveryProgrammeAdminApiRef).toBeDefined();

    expect(deliveryProgrammeAdminApiRef).toEqual({ id: 'mockedApiRef' });
  });
});
