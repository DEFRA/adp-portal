import type { RequestContextProvider } from '@internal/plugin-request-context-provider-backend';
import type { Fetch } from '../types';

export type ForwardHeaderOptions = {
  readonly header: string;
  readonly requestContext: RequestContextProvider;
  readonly filter?: (url: string) => boolean;
};

export function forwardHeader(options: ForwardHeaderOptions) {
  const { requestContext, header, filter = () => true } = options;
  return (input: Parameters<Fetch>[0]) => {
    if (!filter(getUrlString(input))) return undefined;

    const authHeader = requestContext.getContext()?.request.header(header);
    if (!authHeader) return undefined;

    return authHeader;
  };
}

function getUrlString(input: string | URL | Request): string {
  switch (typeof input) {
    case 'string':
      return input;
    case 'object':
      if ('url' in input) return String(input.url);
      return String(input);
    default:
      return String(input);
  }
}
