import React from 'react';
import type { TableProps } from '@backstage/core-components';
import { Table } from '@backstage/core-components';

export type DefaultTableProps<T extends object> = Readonly<
  Omit<TableProps<T>, 'options'> & {
    isCompact?: boolean;
  }
>;

export function DefaultTable<T extends object>({
  isCompact,
  ...props
}: DefaultTableProps<T>) {
  return (
    <Table
      options={{ paging: true, padding: isCompact ? 'dense' : 'default' }}
      {...props}
    />
  );
}
