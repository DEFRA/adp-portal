import { errorApiRef, useApi } from '@backstage/core-plugin-api';
import { useCallback } from 'react';

export function useErrorCallback({
  name,
  getMessage,
  getStack,
}: {
  name: string;
  getMessage?: (error: unknown) => string;
  getStack?: (error: unknown) => string;
}) {
  const errorApi = useApi(errorApiRef);

  return useCallback(
    (err: unknown) =>
      errorApi.post({
        message: (getMessage ?? String)(err),
        name,
        stack: getStack?.(err),
      }),
    [name, errorApi, getMessage, getStack],
  );
}
