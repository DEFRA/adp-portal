import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import type { DeliveryProjectUser } from '@internal/plugin-adp-common';
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
import { Button, Grid } from '@material-ui/core';
import { DefaultTable, normalizeUsername } from '../../utils';

type DeliveryProjectUserWithActions = DeliveryProjectUser & {
  actions: ReactNode;
  nameLink: ReactNode;
  emailLink: ReactNode;
  role: string;
  githubHandle?: ReactNode;
};

export const DeliveryProjectUserViewPage = () => {
  const { entity } = useEntity();
  const entityRoute = useEntityRoute();

  const deliveryProjectUserApi = useApi(deliveryProjectUserApiRef);
  const deliveryProjectId =
    entity.metadata.annotations?.['adp.defra.gov.uk/delivery-project-id'];

  const { data, loading } = useAsyncDataSource({
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
      data?.map<DeliveryProjectUserWithActions>(d => {
        const username = normalizeUsername(d.email);
        const target = entityRoute(username, 'user', 'default');
        const githubTarget = d.github_username
          ? `https://github.com/${d.github_username}`
          : '';
        const roles = [];
        if (d.is_admin) roles.push('Admin');
        if (d.is_technical) roles.push('Technical Team Member');
        if (!d.is_admin && !d.is_technical) roles.push('Team Member');
        return {
          ...d,
          emailLink: <Link to={`mailto:${d.email}`}> {d.email}</Link>,
          nameLink: <Link to={target}>{d.name}</Link>,
          role: roles.join(', '),
          githubHandle: <Link to={githubTarget}>{d.github_username}</Link>,
          actions: (
            <>
              <Button
                variant="contained"
                color="secondary"
                data-testid={`project-user-remove-button-${d.id}`}
              >
                Remove
              </Button>
              &nbsp;
              <Button
                variant="outlined"
                color="default"
                data-testid={`project-user-edit-button-${d.id}`}
              >
                Edit
              </Button>
            </>
          ),
        };
      }),
    [data, entityRoute],
  );

  const columns: TableColumn<DeliveryProjectUserWithActions>[] = [
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
      title: 'Role',
      field: 'role',
      highlight: false,
      type: 'string',
      sorting: false,
    },
    {
      title: 'GitHub Handle',
      field: 'githubHandle',
      highlight: false,
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
        <ContentHeader title="Delivery Project Users" />
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
