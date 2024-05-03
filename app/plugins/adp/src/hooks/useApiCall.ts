import { useReducer, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';

export type UseApiCallReturn<T> = {
  data: Awaited<T> | undefined;
  refresh: () => void;
  loading: boolean;
};

export function useApiCall<T>(
  apiCall: () => T | Promise<T>,
  onError?: (error: unknown) => void,
): UseApiCallReturn<T>;
export function useApiCall<T>(options: {
  apiCall: () => T | Promise<T>;
  onError?: (error: unknown) => void;
}): UseApiCallReturn<T>;
export function useApiCall<T>(
  ...args:
    | [apiCall: () => Promise<T>, onError?: (error: unknown) => void]
    | [
        options: {
          apiCall: () => Promise<T>;
          onError?: (error: unknown) => void;
        },
      ]
): UseApiCallReturn<T> {
  const [lastError, setLastError] = useState<unknown>();
  const { apiCall, onError } =
    typeof args[0] === 'object'
      ? args[0]
      : {
          apiCall: args[0],
          onError: args[1],
        };

  const [signal, refresh] = useReducer(
    i => (i + 1) % Number.MAX_SAFE_INTEGER,
    0,
  );

  const {
    loading,
    error,
    value: data,
  } = useAsync(() => Promise.resolve(apiCall()), [signal]);

  if (error && lastError !== error) {
    setLastError(error);
    if (!onError) throw error;
    onError(error);
  }

  return { data, refresh, loading };
}
