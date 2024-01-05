import { AnnotationBasedBuildStrategy } from './AnnotationBasedBuildStrategy';

describe('AnnotationBasedBuildStrategy', () => {
  const entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      uid: '0',
      name: 'test',
      annotations: {
        'defra.com/techdocs-builder': 'local'
      }
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('shouldBuild', () => {
    it('should return true when techdocs.build is set to local', async () => {
      const uildStrategy = new AnnotationBasedBuildStrategy();

      const result = await uildStrategy.shouldBuild({ entity });

      expect(result).toBe(true);
    });

  });
});
