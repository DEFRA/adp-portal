import type {
  ReadTreeResponseFactory,
  ReaderFactory,
  UrlReaderPredicateTuple,
} from '@backstage/backend-defaults/urlReader';
import {
  type AuthService,
  type UrlReaderService,
  type UrlReaderServiceReadTreeOptions,
  type UrlReaderServiceReadTreeResponse,
  type UrlReaderServiceReadUrlOptions,
  type UrlReaderServiceReadUrlResponse,
  type UrlReaderServiceSearchOptions,
  type DiscoveryService,
  createServiceFactory,
  createServiceRef,
  coreServices,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { NotFoundError, NotModifiedError } from '@backstage/errors';
import { fetchApiRef, type FetchApi } from '@internal/plugin-fetch-api-backend';
import { createHash } from 'node:crypto';

export interface AdpOnboardingUrlReaderOptions {
  readonly config: Config;
  readonly fetchApi: FetchApi;
  readonly auth: AuthService;
  readonly discovery: DiscoveryService;
  readonly treeResponseFactory: ReadTreeResponseFactory;
}

export class AdpOnboardingUrlReader implements UrlReaderService {
  static factory(
    options: AdpOnboardingUrlReaderOptions,
  ): UrlReaderPredicateTuple[] {
    const baseUrl = this.#getBaseUrl(options.config);
    return [
      {
        predicate: url => url.toString().startsWith(baseUrl),
        reader: new AdpOnboardingUrlReader(options),
      },
    ];
  }

  static #getBaseUrl(config: Config) {
    return `${config.getString('app.baseUrl')}/onboarding/`;
  }

  readonly #baseUrl: string;
  readonly #fetchApi: FetchApi;
  readonly #discovery: DiscoveryService;
  readonly #auth: AuthService;
  readonly #treeResponseFactory: ReadTreeResponseFactory;

  constructor(options: AdpOnboardingUrlReaderOptions) {
    this.#baseUrl = AdpOnboardingUrlReader.#getBaseUrl(options.config);
    this.#fetchApi = options.fetchApi;
    this.#auth = options.auth;
    this.#treeResponseFactory = options.treeResponseFactory;
    this.#discovery = options.discovery;
  }

  async readUrl(
    url: string,
    options?: UrlReaderServiceReadUrlOptions,
  ): Promise<UrlReaderServiceReadUrlResponse> {
    if (!url.startsWith(this.#baseUrl))
      throw new Error(`Unsupported url ${url}`);

    const baseUrl = await this.#discovery.getBaseUrl('adp');
    const { token } = await this.#auth.getPluginRequestToken({
      onBehalfOf: await this.#auth.getOwnServiceCredentials(),
      targetPluginId: 'adp',
    });
    const fullUrl = `${baseUrl}/catalog/${url.slice(this.#baseUrl.length)}/entity.yaml`;
    const response = await this.#fetchApi.fetch(fullUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: options?.signal,
    });

    if (response.status === 304) throw new NotModifiedError();
    if (response.status === 404) {
      throw new NotFoundError(
        `Request failed for ${url}, ${response.status} ${response.statusText}`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `Request failed for ${url}, ${response.status} ${response.statusText}`,
      );
    }

    const content = await response.text();
    const etag = createHash('md5').update(content).digest('hex');
    if (etag === options?.etag) throw new NotModifiedError();

    return {
      buffer: () => Promise.resolve(Buffer.from(content)),
      etag,
    };
  }

  async readTree(
    _url: string,
    _options?: UrlReaderServiceReadTreeOptions,
  ): Promise<UrlReaderServiceReadTreeResponse> {
    return this.#treeResponseFactory.fromReadableArray([]);
  }

  async search(_url: string, _options?: UrlReaderServiceSearchOptions) {
    return {
      etag: '0',
      files: [],
    };
  }
}

export const adpOnboardingUrlReaderFactoryRef = createServiceRef<ReaderFactory>(
  {
    id: 'adp.onboarding-url-reader.factory',
    scope: 'plugin',
    defaultFactory(service) {
      return Promise.resolve(
        createServiceFactory({
          service,
          deps: {
            fetchApi: fetchApiRef,
            auth: coreServices.auth,
            discovery: coreServices.discovery,
          },
          factory(deps) {
            return options =>
              AdpOnboardingUrlReader.factory({
                ...deps,
                ...options,
              });
          },
        }),
      );
    },
  },
);
