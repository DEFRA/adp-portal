import React, { useCallback, useMemo } from 'react';
import { normalizeUsername } from '@internal/plugin-adp-common';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  useAsyncDataSource,
  useEntityRoute,
  useErrorCallback,
} from '../../hooks';
import { deliveryProjectUserApiRef } from './api';
import { useApi } from '@backstage/core-plugin-api';
import type { TableColumn } from '@backstage/core-components';
import { Content, ContentHeader, Link, Page } from '@backstage/core-components';
import { Grid } from '@material-ui/core';
import { DefaultTable } from '../../utils';
import { AddProjectUserButton } from './AddProjectUserButton';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { EditDeliveryProjectUserButton } from './EditDeliveryProjectUserButton';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { RemoveDeliveryProjectUserButton } from './RemoveDeliveryProjectUserButton';

export const DeliveryProjectUserViewPage = () => {
  const { entity } = useEntity();
  const entityRoute = useEntityRoute();

  const deliveryProjectUserApi = useApi(deliveryProjectUserApiRef);
  const deliveryProjectId =
    entity.metadata.annotations?.['adp.defra.gov.uk/delivery-project-id'];

  const { data, refresh, loading } = useAsyncDataSource({
    load: useCallback(
      () =>
        !deliveryProjectId
          ? undefined
          : deliveryProjectUserApi.getByDeliveryProjectId(deliveryProjectId),
      [deliveryProjectUserApi, deliveryProjectId],
    ),
    onError: useErrorCallback({
      name: 'Error while getting the list of Delivery Project Users.',
    }),
  });

  const tableData = useMemo(
    () =>
      data?.map(d => ({
        ...d,
        role:
          [d.is_admin && 'Admin', d.is_technical && 'Technical Team Member']
            .filter(Boolean)
            .join(', ') || 'Team Member',
      })) ?? [],
    [data],
  );

  const columns: TableColumn<(typeof tableData)[number]>[] = [
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
      title: 'Role',
      field: 'role',
    },
    {
      title: 'GitHub Handle',
      field: 'github_username',
      render(d) {
        return d.github_username ? (
          <Link
            to={`https://github.com/${d.github_username}`}
            title={`View ${d.github_username} on github. This will open in a new tab`}
          >
            {d.github_username}
          </Link>
        ) : null;
      },
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
          <>
            <RemoveDeliveryProjectUserButton
              variant="contained"
              color="secondary"
              data-testid={`delivery-project-user-remove-button-${d.id}`}
              deliveryProjectUser={d}
              onRemoved={refresh}
              title={`Edit ${d.name}`}
            >
              Remove
            </RemoveDeliveryProjectUserButton>
            &nbsp;
            <EditDeliveryProjectUserButton
              variant="contained"
              color="default"
              deliveryProjectUser={d}
              data-testid={`delivery-project-user-edit-button-${d.id}`}
              onEdited={refresh}
              title={`Remove ${d.name}`}
            >
              Edit
            </EditDeliveryProjectUserButton>
          </>
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
        <ContentHeader title="Delivery Project Users">
          <AddProjectUserButton
            deliveryProjectId={deliveryProjectId!}
            entityRef={stringifyEntityRef(entity)}
            variant="contained"
            size="large"
            color="primary"
            startIcon={<AddBoxIcon />}
            onCreated={refresh}
          >
            Add Team Members
          </AddProjectUserButton>
        </ContentHeader>
        <Grid item>
          <div>
            <DefaultTable
              data={tableData}
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
