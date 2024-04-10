import { deliveryProgrammeGroupTransformer } from './deliveryProgrammeTransformers';

describe('deliveryProgrammeGroupTransformer', () => {
  it('should transform a valid ArmsLengthBody to a GroupEntity', async () => {
    const deliveryProgramme = {
      programme_managers: [],
      title: 'Test title 1',
      alias: 'Test Alias',
      description: 'Test description',
      finance_code: 'Test finance_code',
      arms_length_body_id: '05aa36b6-c7a2-4c35-820e-c31d20011f47',
      delivery_programme_code: 'Test delivery_programme_code',
      url: 'https://www.example.uk/',
      name: 'test-title-1',
      id: '1234',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const expectedGroupEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Group',
      metadata: {
        name: 'test-title-1',
        title: 'Test title 1 (Test Alias)',
        description: 'Test description',
        tags: [],
        annotations: {
          'backstage.io/managed-by-location':
            'adp:delivery-programme\\test-title-1',
          'backstage.io/managed-by-origin-location':
            `adp:delivery-programme\\test-title-1`,
        },
        links: [{ url: 'https://www.example.uk/' }],
      },
      spec: {
        type: 'delivery-programme',
        children: [],
      },
    };

    const result = await deliveryProgrammeGroupTransformer(deliveryProgramme);
    expect(result).toEqual(expectedGroupEntity);
  });
});
