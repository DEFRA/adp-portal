import type { Config } from '@backstage/config';
import type { DeliveryProject } from '@internal/plugin-adp-common';
import type { IDeliveryProgrammeStore } from '../deliveryProgramme';
import type { FetchApi } from '@internal/plugin-fetch-api-backend';
import type { TokenProvider } from '@internal/plugin-credentials-context-backend';

export type FluxConfig = {
  key: string;
  value: string;
};

export type FluxEnvironment = {
  name: string;
  ConfigVariables: FluxConfig[];
};

export type FluxService = {
  name: string;
  type: string;
  environments: FluxEnvironment[];
  configVariables: FluxConfig[];
};

export type FluxTeamConfig = {
  serviceCode: string;
  programmeName: string;
  teamName: string;
  services: FluxService[];
  configVariables: FluxConfig[];
};

export type IFluxConfigApi = { [P in keyof FluxConfigApi]: FluxConfigApi[P] };
export type FluxConfigApiOptions = {
  config: Config;
  deliveryProgrammeStore: IDeliveryProgrammeStore;
  fetchApi: FetchApi;
  tokens: TokenProvider;
};

export class FluxConfigApi {
  readonly #apiBaseUrl: string;
  readonly #deliveryProgrammeStore: IDeliveryProgrammeStore;
  readonly #config: Config;
  readonly #fetchApi: FetchApi;
  readonly #tokens: TokenProvider;

  constructor(options: FluxConfigApiOptions) {
    this.#apiBaseUrl = options.config.getString(
      'adp.fluxOnboarding.apiBaseUrl',
    );
    this.#deliveryProgrammeStore = options.deliveryProgrammeStore;
    this.#config = options.config;
    this.#fetchApi = options.fetchApi;
    this.#tokens = options.tokens;
  }

  async createFluxConfig(deliveryProject: DeliveryProject) {
    const endpoint = `${this.#apiBaseUrl}/${deliveryProject.name}`;
    const { token } = await this.#tokens.getLimitedUserToken();

    const deliveryProgramme = await this.#deliveryProgrammeStore.get(
      deliveryProject.delivery_programme_id,
    );

    if (!deliveryProgramme) {
      throw new Error(
        `Delivery Programme with ID ${deliveryProject.delivery_programme_id} for project ${deliveryProject.id} not found`,
      );
    }

    const configValues = this.parseConfigKeyValues(
      'adp.fluxOnboarding.defaultConfigVariables',
    );

    const teamConfig = {
      programmeName: deliveryProgramme.name,
      serviceCode: deliveryProject.delivery_project_code,
      teamName: deliveryProject.name,
      services: [],
      configVariables: configValues,
    };

    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(teamConfig),
    });

    if (!response.ok) {
      throw new Error(
        `Unexpected response from FluxConfig API. Expected 204 but got ${response.status} - ${response.statusText}`,
      );
    }
  }

  async getFluxConfig(teamName: string): Promise<FluxTeamConfig | null> {
    const endpoint = `${this.#apiBaseUrl}/${teamName}`;
    const { token } = await this.#tokens.getLimitedUserToken();
    const statusCodeNotFound = 404;

    const response = await this.#fetchApi.fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === statusCodeNotFound) {
      return null;
    }
    if (!response.ok) {
      throw new Error(
        `Unexpected response from FluxConfig API. Expected 200 but got ${response.status} - ${response.statusText}`,
      );
    }

    const fluxTeamConfig = (await response.json()) as FluxTeamConfig;

    return fluxTeamConfig;
  }

  private parseConfigKeyValues(configKey: string) {
    const keyValueMap = new Map();

    if (this.#config.has(configKey)) {
      this.#config.getConfigArray(configKey).forEach(configVar => {
        keyValueMap.set(
          configVar.getString('key'),
          configVar.getString('value'),
        );
      });
    }

    const keyValues = Object.fromEntries(keyValueMap.entries());
    return keyValues;
  }
}
