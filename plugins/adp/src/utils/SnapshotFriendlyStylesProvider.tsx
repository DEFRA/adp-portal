import React, { type PropsWithChildren } from 'react';

import { StylesProvider } from '@material-ui/core';

export function SnapshotFriendlyStylesProvider({
  children,
}: Readonly<PropsWithChildren<{}>>) {
  if (process.env.JEST_WORKER_ID === undefined)
    throw new Error('SnapshotFriendlyStylesProvider is a test-only component');
  return (
    <StylesProvider
      generateClassName={(rule, styleSheet) =>
        `${styleSheet?.options.classNamePrefix}-${rule.key}`
      }
    >
      {children}
    </StylesProvider>
  );
}
