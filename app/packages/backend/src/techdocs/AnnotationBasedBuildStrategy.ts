import type { Entity } from '@backstage/catalog-model';

import type { DocsBuildStrategy } from '@backstage/plugin-techdocs-node';

export class AnnotationBasedBuildStrategy implements DocsBuildStrategy {
  async shouldBuild(params: { entity: Entity }): Promise<boolean> {
    return (
      params.entity.metadata?.annotations?.['defra.com/techdocs-builder'] ===
      'local'
    );
  }
}
