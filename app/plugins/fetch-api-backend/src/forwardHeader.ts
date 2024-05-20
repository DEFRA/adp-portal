import type { RequestContextProvider } from '@internal/plugin-request-context-provider-backend';
import type { Fetch } from './Fetch';
import type { Config } from '@backstage/config';

export type ForwardHeaderOptions = {
  readonly header: string;
  readonly requestContext: RequestContextProvider;
  readonly filter:
    | ((url: string) => boolean)
    | {
        config: Config;
        allowUrlsKey: string;
      };
};

export function forwardHeader(options: ForwardHeaderOptions) {
  const { requestContext, header } = options;
  const canForwardToUrl =
    typeof options.filter === 'function'
      ? options.filter
      : createAllowedUrlFilter(
          options.filter.config,
          options.filter.allowUrlsKey,
        );
  if (!canForwardToUrl) return undefined;
  return (input: Parameters<Fetch>[0]) => {
    const authHeader = requestContext.getContext()?.request.header(header);

    if (!authHeader || !canForwardToUrl(getUrlString(input))) return undefined;

    return authHeader;
  };
}

function getUrlString(input: string | URL | Request): string {
  switch (typeof input) {
    case 'string':
      return input;
    case 'object':
      if (input !== null && 'url' in input) return String(input.url);
      return String(input);
    default:
      return String(input);
  }
}

function createAllowedUrlFilter(
  config: Config,
  allowUrlsKey: string,
): (url: string) => boolean {
  const backendUrl = config.getString('backend.baseUrl').toLowerCase();
  const forwardUrls = config.getOptionalStringArray(allowUrlsKey) ?? [];
  const urlMatchers: Array<(url: string) => boolean> = [
    url => url.startsWith(backendUrl),
  ];
  for (const template of forwardUrls) {
    const lastSlash = template.lastIndexOf('/');
    if (template.startsWith('/') && lastSlash > 1) {
      const regexBody = template.slice(1, lastSlash);
      const regexFlags = template.slice(lastSlash + 1);
      const regex = new RegExp(regexBody, `${regexFlags}i`);
      urlMatchers.push(url => regex.test(url));
    } else {
      const prefix = template.toLowerCase();
      urlMatchers.push(url => url.startsWith(prefix));
    }
  }

  return url => {
    const urlLower = url.toLowerCase();
    return urlMatchers.some(m => m(urlLower));
  };
}
