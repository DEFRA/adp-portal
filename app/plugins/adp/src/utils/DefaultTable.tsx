import React from 'react';
import type { TableProps } from '@backstage/core-components';
import { Table } from '@backstage/core-components';

export type DefaultTableProps<T extends object> = Readonly<
  TableProps<T> & {
    isCompact?: boolean;
  }
>;

export function DefaultTable<T extends object>({
  isCompact,
  ...props
}: DefaultTableProps<T>) {
  return (
    <Table
      options={{
        paging: true,
        padding: isCompact ? 'dense' : 'default',
        ...props.options,
      }}
      {...props}
    />
  );
}
