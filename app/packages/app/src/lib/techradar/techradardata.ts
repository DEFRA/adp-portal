import type { FetchApi } from '@backstage/core-plugin-api';
import type { TechRadarApi } from './techradarapi';
import type { Config } from '@backstage/config';

export class AdpDataTechRadarApi implements TechRadarApi {
  readonly #configApi: Config;
  readonly #fetchApi: FetchApi;

  constructor(configApi: Config, fetchApi: FetchApi) {
    this.#configApi = configApi;
    this.#fetchApi = fetchApi;
  }

  async load() {
    const rawData = this.#configApi.getString('techRadar.data');
    const data = await this.#fetchApi.fetch(rawData).then(res => res.json());

    return {
      ...data,
      entries: data.entries.map((entry: { timeline: any[] }) => ({
        ...entry,
        timeline: entry.timeline.map(timeline => ({
          ...timeline,
          date: new Date(timeline.date),
        })),
      })),
    };
  }
}
