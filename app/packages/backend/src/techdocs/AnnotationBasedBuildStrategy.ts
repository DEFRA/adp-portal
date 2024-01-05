import { Entity } from "@backstage/catalog-model";

import { DocsBuildStrategy } from "@backstage/plugin-techdocs-node";

export class AnnotationBasedBuildStrategy implements DocsBuildStrategy {
  async shouldBuild(params: { entity: Entity; }): Promise<boolean> {
    return (
      params.entity.metadata?.annotations?.['defra.com/techdocs-builder'] ===
      'local'
    );
  }
}
