import type { FetchMiddlewareCondition } from './createFetchApi';
import {
  type CreateUrlFilterOptions,
  createUrlFilter,
} from './createUrlFilter';

export function createUrlFetchMiddlewareFilter(
  options: CreateUrlFilterOptions,
): FetchMiddlewareCondition {
  const urlFilter = createUrlFilter(options);

  return input => {
    if (typeof input === 'string') return urlFilter(input);
    if ('url' in input) return urlFilter(input.url);
    return urlFilter(String(input));
  };
}
