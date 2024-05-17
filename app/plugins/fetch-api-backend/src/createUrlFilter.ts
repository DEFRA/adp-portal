import type { Config } from '@backstage/config';

type Maybe<T> = T | { [P in keyof T]?: undefined };
export type CreateUrlFilterOptions = {
  urlPrefixAllowList?: string[];
  allowUrl?: (url: string) => boolean;
} & Maybe<{
  config: Config;
  configKeys: string[];
}>;

export function createUrlFilter(
  options: CreateUrlFilterOptions,
): (url: string) => boolean {
  const prefixes = [];
  if (options.urlPrefixAllowList) prefixes.push(...options.urlPrefixAllowList);
  if (options.configKeys) {
    if (!options.config)
      throw new Error('Cannot get config keys without a config');
    prefixes.push(
      ...options.configKeys
        .map(k => options.config?.getOptionalString(k))
        .filter((v): v is string => typeof v === 'string'),
    );
  }

  if (prefixes.length === 0) return options.allowUrl ?? (() => false);

  const prefixMatcher = buildPrefixMatcher(prefixes);
  if (!options.allowUrl) return prefixMatcher;

  const allowUrl = options.allowUrl;
  return url => prefixMatcher(url) || allowUrl(url);
}

function buildPrefixMatcher(prefixes: string[]): (url: string) => boolean {
  const trimmedPrefixes = prefixes.map(prefix => prefix.replace(/\/$/, ''));
  return url =>
    trimmedPrefixes.some(
      prefix => url === prefix || url.startsWith(`${prefix}/`),
    );
}
