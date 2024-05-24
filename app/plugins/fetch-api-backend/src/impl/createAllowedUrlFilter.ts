import type { Config } from '@backstage/config';

export function createAllowedUrlFilter(
  config: Config,
  allowUrlsKey: string,
): (url: string) => boolean {
  const backendUrl = config.getString('backend.baseUrl');
  const forwardUrls = config.getOptionalStringArray(allowUrlsKey) ?? [];
  const urlMatchers = forwardUrls.map(toUrlMatcher);
  urlMatchers.unshift(urlPrefixMatcher(backendUrl));

  return url => {
    const normalized = normalize(url);
    return urlMatchers.some(m => m(normalized));
  };
}

function normalize(url: string) {
  return url.endsWith('/') ? url.toLowerCase() : `${url.toLowerCase()}/`;
}

function tryParseRegex(template: string) {
  if (!template.startsWith('/')) return undefined;
  const lastSlash = template.lastIndexOf('/');
  if (lastSlash <= 1) return undefined;
  const regexBody = template.slice(1, lastSlash);
  const regexFlags = template.slice(lastSlash + 1);
  try {
    return new RegExp(regexBody, `${regexFlags}i`);
  } catch {
    return undefined;
  }
}

function toUrlMatcher(template: string): (url: string) => boolean {
  const regex = tryParseRegex(template);
  if (regex) return regex.test.bind(regex);
  return urlPrefixMatcher(template);
}

function urlPrefixMatcher(prefix: string) {
  const normalized = normalize(prefix);
  return (url: string) => url.startsWith(normalized);
}
