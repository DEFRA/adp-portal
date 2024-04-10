import { createApiRef } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  createApiRef: jest.fn().mockReturnValue({ id: 'mockedApiRef' }),
}));

describe('DeliveryProgrammeApiRef', () => {
  it('should create an API reference with the correct id', async () => {
    const { DeliveryProgrammeApiRef } = await import('./DeliveryProgrammeApi');
    expect(createApiRef).toHaveBeenCalledWith({
      id: 'plugin.adp.deliveryprogrammeapi',
    });

    expect(DeliveryProgrammeApiRef).toBeDefined();

    expect(DeliveryProgrammeApiRef).toEqual({ id: 'mockedApiRef' });
  });
});
