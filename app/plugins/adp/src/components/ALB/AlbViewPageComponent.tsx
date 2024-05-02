import React, { useState, useEffect, useReducer, ReactNode } from 'react';
import { Typography } from '@material-ui/core';
import AddBoxIcon from '@mui/icons-material/AddBox';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  TableColumn,
} from '@backstage/core-components';
import { DefaultTable } from '../../utils';
import { useApi, errorApiRef } from '@backstage/core-plugin-api';
import { ArmsLengthBody } from '@internal/plugin-adp-common';
import { armsLengthBodyApiRef } from './api';
import { CreateAlbButton } from './CreateAlbButton';
import { EditAlbButton } from './EditAlbButton';

type ArmsLengthBodyWithActions = ArmsLengthBody & {
  actions: ReactNode;
};

export const AlbViewPageComponent = () => {
  const [tableData, setTableData] = useState<ArmsLengthBodyWithActions[]>([]);
  const [key, refetchArmsLengthBody] = useReducer(i => i + 1, 0);
  const errorApi = useApi(errorApiRef);
  const client = useApi(armsLengthBodyApiRef);

  const getAllArmsLengthBodies = async () => {
    try {
      const data = await client.getArmsLengthBodies();
      setTableData(
        data.map(d => ({
          ...d,
          actions: (
            <EditAlbButton
              variant="contained"
              color="default"
              data-testid={`alb-edit-button-${d.id}`}
              armsLengthBody={d}
              onEdited={refetchArmsLengthBody}
            >
              Edit
            </EditAlbButton>
          ),
        })),
      );
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  useEffect(() => {
    getAllArmsLengthBodies();
  }, [key]);

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
            onCreated={refetchArmsLengthBody}
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
          data={tableData}
          columns={columns}
          title="View all"
          isCompact={true}
        />
      </Content>
    </Page>
  );
};
