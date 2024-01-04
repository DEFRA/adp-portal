
import React from 'react';
import { Table, TableColumn, Progress } from '@backstage/core-components';
import Alert from '@material-ui/lab/Alert';
import useAsync from 'react-use/lib/useAsync';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { Button } from '@material-ui/core';

export type DeliveryProgramme = {
  name: string;
  title: string;
  armLengthBody: string;
  deliveryProgrammeCode: number;
  description?: string;
  id: string;
  timestamp: number;
};

type DeliveryProgrammesTableProps = {
  deliveryProgrammes: DeliveryProgramme[];
  onEdit(deliveryProgramme: DeliveryProgramme): any;
};

export const DeliveryProgrammeList = ({ onEdit }: { onEdit(deliveryProgramme: DeliveryProgramme): any }) => {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);

  const { value, loading, error } = useAsync(async (): Promise<DeliveryProgramme[]> => {
    const response = await fetch(
      `${await discoveryApi.getBaseUrl('adp')}/deliveryProgrammes`,
    );
    return response.json();
  }, []);

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  return <DeliveryProgrammesTable deliveryProgrammes={value || []} onEdit={onEdit} />;
};

export function DeliveryProgrammesTable({ deliveryProgrammes, onEdit }: DeliveryProgrammesTableProps) {
  const columns: TableColumn<DeliveryProgramme>[] = [
    { title: 'Name', field: 'name' },
    { title: 'Title', field: 'title' },
    {
      title: 'Last edit',
      field: 'timestamp',
      render: e => new Date(e.timestamp).toLocaleString(),
    },
    {
      title: 'Action',
      render: deliveryProgramme => {
        return (
          <Button variant="contained" onClick={() => onEdit(deliveryProgramme)}>
            Edit
          </Button>
        );
      },
    },
  ];

  return (
    <Table
      title="Delivery Programmes"
      options={{ search: false, paging: false }}
      columns={columns}
      data={deliveryProgrammes}
    />
  );
}
