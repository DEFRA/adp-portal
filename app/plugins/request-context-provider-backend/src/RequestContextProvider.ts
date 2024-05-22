import type { RequestContext } from './RequestContext';

export interface RequestContextProvider {
  getContext(): RequestContext | undefined;
}
