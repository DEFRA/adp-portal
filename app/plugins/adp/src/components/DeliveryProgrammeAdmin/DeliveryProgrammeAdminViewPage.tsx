import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { TableColumn } from '@backstage/core-components';
import { Content, ContentHeader, Link, Page } from '@backstage/core-components';
import {
  normalizeUsername,
  type DeliveryProgrammeAdmin,
} from '@internal/plugin-adp-common';
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
import { AddProgrammeAdminButton } from './AddProgrammeAdminButton';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { stringifyEntityRef } from '@backstage/catalog-model';

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

  const { data, refresh, loading } = useAsyncDataSource({
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
      sorting: false,
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
      sorting: false,
    },
  ];

  return (
    <Page themeId="tool">
      <Content>
        <ContentHeader title="Delivery Programme Admins">
          <AddProgrammeAdminButton
            deliveryProgrammeId={deliveryProgrammeId!}
            variant="contained"
            size="large"
            color="primary"
            startIcon={<AddBoxIcon />}
            onCreated={refresh}
            data-testid="delivery-programme-admin-add-button"
            entityRef={stringifyEntityRef(entity)}
          >
            Add Delivery Programme Admin
          </AddProgrammeAdminButton>
        </ContentHeader>
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
