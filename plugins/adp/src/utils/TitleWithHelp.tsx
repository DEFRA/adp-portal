import { Button } from '@material-ui/core';
import Help from '@mui/icons-material/Help';
import type { PropsWithChildren } from 'react';
import React from 'react';

export type TitleWithHelpProps = PropsWithChildren<
  Readonly<{
    href: string;
  }>
>;

export function TitleWithHelp({ children, href }: TitleWithHelpProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
      <h3 style={{ flexGrow: 1, margin: 0 }}>{children}</h3>
      <Button
        style={{ flexGrow: 0 }}
        color="primary"
        size="large"
        href={href}
        target="_blank"
        startIcon={<Help />}
      >
        Help
      </Button>
    </div>
  );
}
