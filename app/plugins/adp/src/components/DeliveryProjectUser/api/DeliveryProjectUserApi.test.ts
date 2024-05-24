import { createApiRef } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  createApiRef: jest.fn().mockReturnValue({ id: 'mockedApiRef' }),
}));

describe('deliveryProjectUserApiRef', () => {
  it('should create an API reference with the correct id', async () => {
    const { deliveryProjectUserApiRef } = await import(
      './DeliveryProjectUserApi'
    );
    expect(createApiRef).toHaveBeenCalledWith({
      id: 'plugin.adp.deliveryprojectuserapi',
    });

    expect(deliveryProjectUserApiRef).toBeDefined();

    expect(deliveryProjectUserApiRef).toEqual({ id: 'mockedApiRef' });
  });
});
