import type { IDeliveryProjectStore } from '../deliveryProject';
import type { IDeliveryProjectUserStore } from '../deliveryProjectUser';
import type { IEntraIdApi } from './EntraIdApi';

export type IDeliveryProjectEntraIdGroupsSyncronizer = {
  [P in keyof DeliveryProjectEntraIdGroupsSyncronizer]: DeliveryProjectEntraIdGroupsSyncronizer[P];
};

export class DeliveryProjectEntraIdGroupsSyncronizer
  implements IDeliveryProjectEntraIdGroupsSyncronizer
{
  readonly #entraIdApi: IEntraIdApi;
  readonly #deliveryProjectStore: IDeliveryProjectStore;
  readonly #deliveryProjectUserStore: IDeliveryProjectUserStore;

  public constructor(
    entraIdApi: IEntraIdApi,
    deliveryProjectStore: IDeliveryProjectStore,
    deliveryProjectUserStore: IDeliveryProjectUserStore,
  ) {
    this.#entraIdApi = entraIdApi;
    this.#deliveryProjectStore = deliveryProjectStore;
    this.#deliveryProjectUserStore = deliveryProjectUserStore;
  }

  async syncronizeById(projectId: string) {
    const deliveryProject = await this.#deliveryProjectStore.get(projectId);
    const deliveryProjectUsers =
      await this.#deliveryProjectUserStore.getByDeliveryProject(
        deliveryProject.id,
      );

    await this.#entraIdApi.setProjectGroupMembers(
      deliveryProjectUsers,
      deliveryProject.name,
    );
  }
}
