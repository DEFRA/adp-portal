import { defaultGroupTransformer } from './AlbTransformers';

describe('defaultGroupTransformer', () => {
  it('should transform valid ArmsLengthBody to GroupEntity', async () => {
    const armsLengthBody = {
      creator: 'ADP',
      owner: 'ADP',
      title: 'Environment Agency',
      name: 'environment-agency',
      short_name: 'EA',
      description: 'testDescription',
      url: 'https://www.example.uk/',
      id: '1234',
      timestamp: new Date(),
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
            '`adp:arms-length-body\\${armsLengthBody.name}`',
        },
        links: [
          {url: 'https://www.example.uk/'}
        ]
      },
      spec: {
        type: 'arms-length-body',
        children: [],
      },
    };

    const result = await defaultGroupTransformer(armsLengthBody);
    expect(result).toEqual(expectedGroupEntity);
  });
});
