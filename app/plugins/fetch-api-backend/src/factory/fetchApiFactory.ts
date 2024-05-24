import { fetchApiRef } from '../ref';
import {
  createFetchApiFactory,
  type CoreFetchApiOptions,
} from './createFetchApiFactory';

export interface FetchApiOptions extends CoreFetchApiOptions<'plugin'> {}
export const fetchApiFactory = createFetchApiFactory<FetchApiOptions, 'plugin'>(
  fetchApiRef,
);
