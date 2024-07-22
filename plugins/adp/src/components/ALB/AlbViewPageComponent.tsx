import React, { useCallback } from 'react';
import { Typography } from '@material-ui/core';
import AddBoxIcon from '@material-ui/icons/AddBox';
import type { TableColumn } from '@backstage/core-components';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  Link,
} from '@backstage/core-components';
import { DefaultTable } from '../../utils';
import { useApi } from '@backstage/core-plugin-api';
import { armsLengthBodyApiRef } from './api';
import { CreateAlbButton } from './CreateAlbButton';
import { EditAlbButton } from './EditAlbButton';
import {
  useAsyncDataSource,
  useEntityRoute,
  useErrorCallback,
} from '../../hooks';
import type { ArmsLengthBody } from '@internal/plugin-adp-common';

export const AlbViewPageComponent = () => {
  const client = useApi(armsLengthBodyApiRef);
  const entityRoute = useEntityRoute();
  const { data, refresh, loading } = useAsyncDataSource(
    useCallback(() => client.getArmsLengthBodies(), [client]),
    useErrorCallback({
      name: 'Error while getting the list of arms length bodies.',
    }),
  );

  const columns: TableColumn<ArmsLengthBody>[] = [
    {
      title: 'Name',
      field: 'title',
      defaultSort: 'asc',
      highlight: true,
      render(d) {
        return (
          <Link
            to={entityRoute(d.name, 'group')}
            title={`View ${d.title} in the catalog`}
          >
            {d.title}
          </Link>
        );
      },
    },
    {
      title: 'Alias',
      field: 'alias',
    },
    {
      title: 'Description',
      field: 'description',
    },
    {
      title: 'Website',
      field: 'url',
      render(d) {
        return d.url ? (
          <Link
            to={d.url}
            title={`Visit the website for ${d.title}. This will open in a new tab`}
          >
            {d.url}
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
          <EditAlbButton
            variant="contained"
            color="default"
            data-testid={`alb-edit-button-${d.id}`}
            armsLengthBody={d}
            onEdited={refresh}
            title={`Edit ${d.title}`}
          >
            Edit
          </EditAlbButton>
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
      <Header
        title="Azure Development Platform: Onboarding"
        subtitle="ADP Platform Configuration"
      />
      <Content>
        <ContentHeader title="Arms Length Bodies">
          <CreateAlbButton
            variant="contained"
            size="large"
            color="primary"
            startIcon={<AddBoxIcon />}
            onCreated={refresh}
            data-testid="alb-add-button"
          >
            Add ALB
          </CreateAlbButton>
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the
            Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Typography paragraph>
          View or add Arms Length Bodies to the Azure Developer Platform.
        </Typography>
        <DefaultTable
          data={data ?? []}
          columns={columns}
          isCompact
          isLoading={loading}
        />
      </Content>
    </Page>
  );
};
