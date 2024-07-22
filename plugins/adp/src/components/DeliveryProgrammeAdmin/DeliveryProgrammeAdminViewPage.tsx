import React, { useCallback } from 'react';
import type { TableColumn } from '@backstage/core-components';
import { Content, ContentHeader, Link, Page } from '@backstage/core-components';
import {
  normalizeUsername,
  type DeliveryProgrammeAdmin,
} from '@internal/plugin-adp-common';
import { Grid } from '@material-ui/core';
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
import { RemoveDeliveryProgrammeAdminButton } from './RemoveDeliveryProgrammeAdminButton';

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

  const columns: TableColumn<DeliveryProgrammeAdmin>[] = [
    {
      title: 'Name',
      field: 'name',
      defaultSort: 'asc',
      highlight: true,
      render(d) {
        const username = normalizeUsername(d.email);
        return (
          <Link
            to={entityRoute(username, 'user')}
            title={`View ${d.name} in the catalog`}
          >
            {d.name}
          </Link>
        );
      },
    },
    {
      title: 'Contact',
      field: 'email',
      render(d) {
        return (
          <Link
            to={`mailto:${d.email}`}
            title={`Send an email to ${d.name}. This will open in your configured email client`}
          >
            {d.email}
          </Link>
        );
      },
    },
    {
      title: 'role',
      emptyValue: 'Delivery Programme Admin',
    },
    {
      title: 'Updated At',
      field: 'updated_at',
      type: 'datetime',
      cellStyle: { whiteSpace: 'nowrap' },
    },
    {
      sorting: false,
      cellStyle: { whiteSpace: 'nowrap' },
      render(d) {
        return (
          <RemoveDeliveryProgrammeAdminButton
            variant="contained"
            color="secondary"
            data-testid={`delivery-programme-admin-remove-button-${d.id}`}
            deliveryProgrammeAdmin={d}
            entityRef={stringifyEntityRef(entity)}
            onRemoved={refresh}
            title={`Remove ${d.name}`}
          >
            Remove
          </RemoveDeliveryProgrammeAdminButton>
        );
      },
    },
  ];
  columns.forEach(c => {
    c.width ??= '';
    c.headerStyle = { whiteSpace: 'nowrap' };
  });

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
              data={data ?? []}
              columns={columns}
              isCompact
              isLoading={loading}
            />
          </div>
        </Grid>
      </Content>
    </Page>
  );
};
