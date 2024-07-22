import { rootFetchApiRef } from '../ref';
import {
  createFetchApiFactory,
  type CoreFetchApiOptions,
} from './createFetchApiFactory';

export interface RootFetchApiOptions extends CoreFetchApiOptions<'root'> {}
export const rootFetchApiFactory = createFetchApiFactory<
  RootFetchApiOptions,
  'root'
>(rootFetchApiRef);
