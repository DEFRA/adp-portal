import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useEntityRoute } from './useEntityRoute';
import { wrapInTestApp } from '@backstage/test-utils';
import { entityRouteRef } from '@backstage/plugin-catalog-react';

describe('useEntityRoute', () => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }: React.PropsWithChildren<{}>) =>
    wrapInTestApp(<>{children}</>, {
      mountedRoutes: {
        '/catalog/:namespace/:kind/:name/*': entityRouteRef,
      },
    });

  it('should return route with default namespace', () => {
    const name = 'entity-name';
    const kind = 'group';
    const expectedNamespace = 'default';

    const { result } = renderHook(
      () => {
        const entityRoute = useEntityRoute;
        return entityRoute(name, kind);
      },
      {
        wrapper: Wrapper,
      },
    );

    expect(result.current).toBe(
      `/catalog/${expectedNamespace}/${kind}/${name}`,
    );
  });

  it('should return route with provided namespace', () => {
    const name = 'entity-name';
    const kind = 'group';
    const namespace = 'custom-namespace';

    const { result } = renderHook(
      () => {
        const entityRoute = useEntityRoute;
        return entityRoute(name, kind, namespace);
      },
      {
        wrapper: Wrapper,
      },
    );

    expect(result.current).toBe(`/catalog/${namespace}/${kind}/${name}`);
  });
});
