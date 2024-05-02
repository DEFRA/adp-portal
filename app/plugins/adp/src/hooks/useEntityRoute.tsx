import { parseEntityRef } from "@backstage/catalog-model";
import { useRouteRef } from "@backstage/core-plugin-api";
import { entityRouteRef } from "@backstage/plugin-catalog-react";

export function useEntityRoute(name: string, kind: string, namespace: string = 'default'): string {
  const entityRoute = useRouteRef(entityRouteRef);
  const entityName = parseEntityRef({kind: kind, name: name, namespace: namespace});
  const target = entityRoute(entityName);

  return target;
}
