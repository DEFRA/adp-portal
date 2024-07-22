import { createApiRef } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  createApiRef: jest.fn().mockReturnValue({ id: 'mockedApiRef' }),
}));

describe('DeliveryProjectApiRef', () => {
  it('should create an API reference with the correct id', async () => {
    const { deliveryProjectApiRef: DeliveryProjectApiRef } = await import(
      './DeliveryProjectApi'
    );
    expect(createApiRef).toHaveBeenCalledWith({
      id: 'plugin.adp.deliveryprojectapi',
    });

    expect(DeliveryProjectApiRef).toBeDefined();

    expect(DeliveryProjectApiRef).toEqual({ id: 'mockedApiRef' });
  });
});
