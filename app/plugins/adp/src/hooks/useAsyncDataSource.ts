import { useReducer } from 'react';
import { useAsync } from 'react-use';

export type UseApiCallReturn<T> = {
  data: Awaited<T> | undefined;
  refresh: () => void;
  loading: boolean;
};

export function useAsyncDataSource<T>(
  load: () => T | Promise<T>,
  onError?: (error: unknown) => void,
): UseApiCallReturn<T>;
export function useAsyncDataSource<T>(options: {
  load: () => T | Promise<T>;
  onError?: (error: unknown) => void;
}): UseApiCallReturn<T>;
export function useAsyncDataSource<T>(
  ...args:
    | [apiCall: () => Promise<T>, onError?: (error: unknown) => void]
    | [
        options: {
          load: () => Promise<T>;
          onError?: (error: unknown) => void;
        },
      ]
): UseApiCallReturn<T> {
  const { load, onError } =
    typeof args[0] === 'object'
      ? args[0]
      : {
          load: args[0],
          onError: args[1],
        };

  const [signal, refresh] = useReducer(
    i => (i + 1) % Number.MAX_SAFE_INTEGER,
    0,
  );

  const { loading, value: data } = useAsync(async (): Promise<
    Awaited<T | undefined>
  > => {
    try {
      return await load();
    } catch (err) {
      if (!onError) throw err;
      onError(err);
      return undefined;
    }
  }, [signal]);

  return { data, refresh, loading };
}
