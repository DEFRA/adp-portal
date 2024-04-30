import React from 'react';
import { Table, TableColumn } from '@backstage/core-components';

export type DefaultTableProps<T extends object> = Readonly<{
  data: T[];
  columns: TableColumn<T>[];
  title: string;
  isCompact?: boolean;
}>;

export function DefaultTable<T extends object>({
  data,
  columns,
  title,
  isCompact,
}: DefaultTableProps<T>) {
  return (
    <Table
      options={{ paging: true, padding: isCompact ? 'dense' : 'default' }}
      data={data}
      columns={columns}
      title={title}
    />
  );
}
