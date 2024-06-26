import { parseEntityRef } from '@backstage/catalog-model';
import { useRouteRef } from '@backstage/core-plugin-api';
import { entityRouteRef } from '@backstage/plugin-catalog-react';

export const useEntityRoute = () => {
  const entityRoute = useRouteRef(entityRouteRef);
  return (name: string, kind: string, namespace: string = 'default') => {
    const entityName = parseEntityRef({
      kind: kind,
      name: name,
      namespace: namespace,
    });
    const target = entityRoute(entityName);

    return target;
  };
};
