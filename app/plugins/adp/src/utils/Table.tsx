import React from 'react';
import { Table, TableColumn } from '@backstage/core-components';

type DefaultTableProps = {
  data: Array<{}>;
  columns: TableColumn[];
  title: string;
  isCompact?: boolean;
};

export const DefaultTable = ({ data, columns, title, isCompact }: DefaultTableProps) => {
  return (
    <Table
      options={{ paging: true , padding: isCompact? 'dense' : 'default',}}
      data={data}
      columns={columns}
      title={title}
    />
  );
};
