import type { TechRadarApi } from './techradarapi';
import type { Config } from '@backstage/config';

export class AdpDataTechRadarApi implements TechRadarApi {
  private configApi: Config;

  constructor(configApi: Config) {
    this.configApi = configApi;
  }

  async load() {
    const rawData = this.configApi.getString('techRadar.data');
    const data = await fetch(rawData).then(res => res.json());

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
