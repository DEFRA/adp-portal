import {
  DEFAULT_NAMESPACE,
  type Entity,
  type GroupEntity,
  isGroupEntity,
} from '@backstage/catalog-model';
import {
  type CatalogProcessor,
  type CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import {
  DELIVERY_PROJECT_ADMIN_MEMBERS_ANNOTATION,
  DELIVERY_PROJECT_TECH_MEMBERS_ANNOTATION,
  DELIVERY_PROJECT_USER_IS_ADMIN_MEMBER,
  DELIVERY_PROJECT_USER_IS_TECH_MEMBER,
  USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
  USER_DELIVERY_PROJECT_IS_TECH_MEMBER,
} from '@internal/plugin-adp-common';

export class DeliveryProjectProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'DeliveryProjectProcessor';
  }
  async postProcessEntity(
    entity: Entity,
    _location: unknown,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (!isGroupEntity(entity) || entity.spec.type !== 'delivery-project')
      return entity;

    this.#emitRelations(
      entity,
      emit,
      DELIVERY_PROJECT_TECH_MEMBERS_ANNOTATION,
      {
        projectHas: DELIVERY_PROJECT_USER_IS_TECH_MEMBER,
        userIs: USER_DELIVERY_PROJECT_IS_TECH_MEMBER,
      },
    );
    this.#emitRelations(
      entity,
      emit,
      DELIVERY_PROJECT_ADMIN_MEMBERS_ANNOTATION,
      {
        projectHas: DELIVERY_PROJECT_USER_IS_ADMIN_MEMBER,
        userIs: USER_DELIVERY_PROJECT_IS_ADMIN_MEMBER,
      },
    );

    return entity;
  }

  #emitRelations(
    entity: GroupEntity,
    emit: CatalogProcessorEmit,
    annotation: string,
    types: {
      projectHas: string;
      userIs: string;
    },
  ) {
    const users = this.#parseStringArray(
      entity.metadata.annotations?.[annotation],
    );
    const projectRef = {
      kind: entity.kind,
      name: entity.metadata.name,
      namespace: entity.metadata.namespace ?? DEFAULT_NAMESPACE,
    };

    for (const user of users) {
      const userRef = {
        kind: 'user',
        namespace: DEFAULT_NAMESPACE,
        name: user,
      };
      emit(
        processingResult.relation({
          source: projectRef,
          target: userRef,
          type: types.projectHas,
        }),
      );
      emit(
        processingResult.relation({
          source: userRef,
          target: projectRef,
          type: types.userIs,
        }),
      );
    }
  }

  #parseStringArray(value: string | undefined) {
    if (!value) return [];
    try {
      const result = JSON.parse(value);
      if (!Array.isArray(result)) return [];
      return result.filter(v => typeof v === 'string');
    } catch {
      return [];
    }
  }
}
