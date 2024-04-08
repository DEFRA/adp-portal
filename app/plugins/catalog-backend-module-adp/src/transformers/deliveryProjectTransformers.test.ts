import { deliveryProjectGroupTransformer } from './deliveryProjectTransformer';

describe('deliveryProjectGroupTransformer', () => {
  it('should transform a valid DeliveryProject to a GroupEntity', async () => {
    const deliveryProject = {
      title: 'Test title 1',
      alias: 'Test Alias',
      description: 'Test description',
      finance_code: 'Test finance_code',
      delivery_programme_id: '05aa36b6-c7a2-4c35-820e-c31d20011f47',
      delivery_project_code: 'Test delivery_project_code',
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
            'adp:delivery-project\\test-title-1',
          'backstage.io/managed-by-origin-location': `adp:delivery-project\\test-title-1`,
        },
        links: [{ url: 'https://www.example.uk/' }],
      },
      spec: {
        type: 'delivery-project',
        children: [],
      },
    };

    const result = await deliveryProjectGroupTransformer(deliveryProject);
    expect(result).toEqual(expectedGroupEntity);
  });
});
