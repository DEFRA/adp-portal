import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { TableColumn } from '@backstage/core-components';
import { Content, ContentHeader, Link, Page } from '@backstage/core-components';
import type { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { Button, Grid } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { deliveryProgrammeAdminApiRef } from './api';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  useAsyncDataSource,
  useEntityRoute,
  useErrorCallback,
} from '../../hooks';
import { DefaultTable } from '../../utils';

type DeliveryProgrammeAdminWithActions = DeliveryProgrammeAdmin & {
  actions: ReactNode;
  nameLink: ReactNode;
  emailLink: ReactNode;
  role: string;
};

export const DeliveryProgrammeAdminViewPage = () => {
  const { entity } = useEntity();
  const entityRoute = useEntityRoute();

  const deliveryProgrammeAdminApi = useApi(deliveryProgrammeAdminApiRef);
  const deliveryProgrammeId =
    entity.metadata.annotations?.['adp.defra.gov.uk/delivery-programme-id'];

  const { data, loading } = useAsyncDataSource({
    load: useCallback(
      () =>
        !deliveryProgrammeId
          ? undefined
          : deliveryProgrammeAdminApi.getByDeliveryProgrammeId(
              deliveryProgrammeId,
            ),
      [deliveryProgrammeAdminApi, deliveryProgrammeId],
    ),
    onError: useErrorCallback({
      name: 'Error while getting the list of delivery programme admins.',
    }),
  });

  const tableData = useMemo(
    () =>
      data?.map<DeliveryProgrammeAdminWithActions>(d => {
        const username = normalizeUsername(d.email);
        const target = entityRoute(username, 'user', 'default');
        return {
          ...d,
          emailLink: <Link to={`mailto:${d.email}`}> {d.email}</Link>,
          nameLink: <Link to={target}>{d.name}</Link>,
          role: 'Delivery Programme Admin',
          actions: (
            <Button
              variant="contained"
              color="secondary"
              data-testid={`programme-admin-edit-button-${d.id}`}
            >
              Remove
            </Button>
          ),
        };
      }),
    [data, entityRoute],
  );

  const columns: TableColumn<DeliveryProgrammeAdminWithActions>[] = [
    {
      title: 'Name',
      field: 'nameLink',
      highlight: true,
    },
    {
      title: 'Contact',
      field: 'emailLink',
      highlight: false,
    },
    {
      title: 'role',
      field: 'role',
      highlight: false,
      type: 'string',
    },
    {
      title: 'Updated At',
      field: 'updated_at',
      highlight: false,
      type: 'datetime',
    },
    {
      highlight: true,
      field: 'actions',
    },
  ];

  return (
    <Page themeId="tool">
      <Content>
        <ContentHeader title="Delivery Programme Admins" />
        <Grid item>
          <div>
            <DefaultTable
              data={tableData ?? []}
              columns={columns}
              title="View all"
              isCompact
              isLoading={loading}
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

  cleaned = cleaned.replace(/(?<=^|[^_])_+$/g, '');
  cleaned = cleaned.replaceAll(/__+/g, '_');

  return cleaned;
}
