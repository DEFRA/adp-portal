import React, { useState, useEffect, useReducer } from 'react';
import {
  Content,
  ContentHeader,
  Link,
  Page,
  TableColumn,
} from '@backstage/core-components';
import { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { Button, Grid } from '@material-ui/core';
import { DefaultTable } from '@internal/plugin-adp/src/utils';
import { errorApiRef, useApi } from '@backstage/core-plugin-api';
import { deliveryProgrammeAdminApiRef } from './api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useEntityRoute } from '../../hooks';

export const DeliveryProgrammeAdminViewPage = () => {
  const [tableData, setTableData] = useState<DeliveryProgrammeAdmin[]>([]);
  const [key, _refetchProgrammeAdmin] = useReducer(i => {
    return i + 1;
  }, 0);
  const { entity } = useEntity();
  const entityRoute = useEntityRoute;

  const deliveryProgrammeAdminApi = useApi(deliveryProgrammeAdminApiRef);
  const errorApi = useApi(errorApiRef);

  const getDeliveryProgrammeAdmins = async () => {
    try {
      const deliveryProgrammeId =
        entity.metadata.annotations!['adp.defra.gov.uk/delivery-programme-id'];
      const data = await deliveryProgrammeAdminApi.getByDeliveryProgrammeId(
        deliveryProgrammeId,
      );
      setTableData(data);
    } catch (error: any) {
      errorApi.post(error);
    }
  };

  useEffect(() => {
    getDeliveryProgrammeAdmins();
  }, [key]);

  const columns: TableColumn[] = [
    {
      title: 'Name',
      field: 'name',
      highlight: true,
      type: 'string',
      render: (row: Partial<DeliveryProgrammeAdmin>) => {
        const username = normalizeUsername(row.email!);
        const target = entityRoute(username, 'user', 'default');
        return <Link to={target}>{row.name!}</Link>;
      },
    },
    {
      title: 'Contact',
      field: 'email',
      highlight: false,
      type: 'string',
      render: (row: Partial<DeliveryProgrammeAdmin>) => (
        <Link to={`mailto:${row.email}`}> {row.email}</Link>
      ),
    },
    {
      title: 'role',
      field: 'role',
      highlight: false,
      type: 'string',
      render: () => <>Delivery Programme Admin</>,
    },
    {
      title: 'Updated At',
      field: 'updated_at',
      highlight: false,
      type: 'datetime',
    },
    {
      highlight: true,
      render: (row: Partial<DeliveryProgrammeAdmin>) => {
        return (
          <Button
            variant="contained"
            color="secondary"
            data-testid={`programme-admin-edit-button-${row.id}`}
          >
            Remove
          </Button>
        );
      },
    },
  ];

  return (
    <Page themeId="tool">
      <Content>
        <ContentHeader title="Delivery Programme Admins"></ContentHeader>
        <Grid item>
          <div>
            <DefaultTable
              data={tableData}
              columns={columns}
              title="View all"
              isCompact={true}
            />
          </div>
        </Grid>
      </Content>
    </Page>
  );
};

function normalizeUsername(name: string): string {
  // Implementation based on Backstage's implementation - importing this
  // causes startup errors as trying to pull a backend module in to a front end.
  // https://github.com/backstage/backstage/blob/master/plugins/catalog-backend-module-msgraph/src/microsoftGraph/helper.ts
  let cleaned = name
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-zA-Z0-9_\-.]/g, '_');

  cleaned = cleaned.replace(/_+$/g, '');
  cleaned = cleaned.replaceAll(/__+/g, '_');

  return cleaned;
}
