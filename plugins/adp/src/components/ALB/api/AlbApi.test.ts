import { createApiRef } from '@backstage/core-plugin-api';

jest.mock('@backstage/core-plugin-api', () => ({
  createApiRef: jest.fn().mockReturnValue({ id: 'mockedApiRef' }),
}));

describe('armsLengthBodyApiRef', () => {
  it('should create an API reference with the correct id', async () => {
    const { armsLengthBodyApiRef } = await import('./AlbApi');
    expect(createApiRef).toHaveBeenCalledWith({
      id: 'plugin.adp.armslengthbodyapi',
    });

    expect(armsLengthBodyApiRef).toBeDefined();

    expect(armsLengthBodyApiRef).toEqual({ id: 'mockedApiRef' });
  });
});
