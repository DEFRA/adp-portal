import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Typography } from '@material-ui/core';
import AddBoxIcon from '@material-ui/icons/AddBox';
import type { TableColumn } from '@backstage/core-components';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
} from '@backstage/core-components';
import { DefaultTable } from '../../utils';
import { useApi } from '@backstage/core-plugin-api';
import type { ArmsLengthBody } from '@internal/plugin-adp-common';
import { armsLengthBodyApiRef } from './api';
import { CreateAlbButton } from './CreateAlbButton';
import { EditAlbButton } from './EditAlbButton';
import { useAsyncDataSource, useErrorCallback } from '../../hooks';

type ArmsLengthBodyWithActions = ArmsLengthBody & {
  actions: ReactNode;
};

export const AlbViewPageComponent = () => {
  const client = useApi(armsLengthBodyApiRef);
  const { data, refresh, loading } = useAsyncDataSource(
    useCallback(() => client.getArmsLengthBodies(), [client]),
    useErrorCallback({
      name: 'Error while getting the list of arms length bodies.',
    }),
  );

  const tableData = useMemo(
    () =>
      data?.map<ArmsLengthBodyWithActions>(d => ({
        ...d,
        actions: (
          <EditAlbButton
            variant="contained"
            color="default"
            data-testid={`alb-edit-button-${d.id}`}
            armsLengthBody={d}
            onEdited={refresh}
          >
            Edit
          </EditAlbButton>
        ),
      })),
    [data, refresh],
  );

  const columns: TableColumn<ArmsLengthBodyWithActions>[] = [
    {
      title: 'Title',
      field: 'title',
      highlight: true,
      type: 'string',
    },
    {
      title: 'Alias',
      field: 'alias',
      highlight: false,
      type: 'string',
    },
    {
      title: 'Description',
      field: 'description',
      highlight: false,
      type: 'string',
    },
    {
      title: 'Website',
      field: 'url',
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
      width: '',
      highlight: true,
      field: 'actions',
    },
  ];

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
          data={tableData ?? []}
          columns={columns}
          title="View all"
          isCompact
          isLoading={loading}
        />
      </Content>
    </Page>
  );
};
