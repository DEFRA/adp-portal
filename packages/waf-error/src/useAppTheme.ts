import {
  type AppTheme,
  appThemeApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { useObservable } from 'react-use';
import { useMemo, useState, useEffect } from 'react';

export function useAppTheme() {
  const appThemeApi = useApi(appThemeApiRef);
  const themes = appThemeApi.getInstalledThemes();
  const themeId = useObservable(
    appThemeApi.activeThemeId$(),
    appThemeApi.getActiveThemeId(),
  );

  const shouldPreferDark = useShouldPreferDarkTheme();
  return getTheme(themes, themeId, shouldPreferDark) ?? themes[0];
}

function useShouldPreferDarkTheme() {
  const mediaQuery = useMemo(
    () => window.matchMedia?.('(prefers-color-scheme: dark)'),
    [],
  );
  const [prefersDark, setPrefersDark] = useState(mediaQuery?.matches);

  useEffect(() => {
    const listener = (event: MediaQueryListEvent) => {
      setPrefersDark(event.matches);
    };
    mediaQuery?.addEventListener('change', listener);
    return () => {
      mediaQuery?.removeEventListener('change', listener);
    };
  }, [mediaQuery]);

  return prefersDark;
}

function getTheme(
  themes: AppTheme[],
  themeId: string | undefined,
  preferDark: boolean,
) {
  if (themeId) {
    const result = themes.find(t => t.id === themeId);
    if (result) return result;
  }

  return preferDark
    ? themes.find(theme => theme.variant === 'dark')
    : undefined;
}
