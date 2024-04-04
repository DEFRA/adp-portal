import { armsLengthBodyGroupTransformer } from './armsLengthBodyGroupTransformer';

describe('armsLengthBodyGroupTransformer', () => {
  it('should transform a valid ArmsLengthBody to a GroupEntity', async () => {
    const armsLengthBody = {
      creator: 'ADP',
      owner: 'ADP',
      title: 'Environment Agency',
      name: 'environment-agency',
      alias: 'EA',
      description: 'testDescription',
      url: 'https://www.example.uk/',
      id: '1234',
      created_at: new Date(),
      updated_at: new Date(),
      children: ['test']
    };

    const expectedGroupEntity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'Group',
      metadata: {
        name: 'environment-agency',
        title: 'Environment Agency (EA)',
        description: 'testDescription',
        tags: [],
        annotations: {
          'backstage.io/managed-by-location':
            'adp:arms-length-body\\environment-agency',
          'backstage.io/managed-by-origin-location':
            'adp:arms-length-body\\environment-agency',
        },
        links: [{ url: 'https://www.example.uk/' }],
      },
      spec: {
        type: 'arms-length-body',
        children: ['test'],
      },
    };

    const result = await armsLengthBodyGroupTransformer(armsLengthBody);
    expect(result).toEqual(expectedGroupEntity);
  });
});
