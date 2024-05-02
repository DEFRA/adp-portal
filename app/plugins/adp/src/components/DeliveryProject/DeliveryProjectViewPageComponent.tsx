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
import {
  DeliveryProject,
  deliveryProjectDisplayName,
} from '@internal/plugin-adp-common';
import { deliveryProjectApiRef } from './api/DeliveryProjectApi';
import { CreateDeliveryProjectButton } from './CreateDeliveryProjectButton';
import { EditDeliveryProjectButton } from './EditDeliveryProjectButton';

type DeliveryProjectWithActions = DeliveryProject & {
  actions: ReactNode;
};

export const DeliveryProjectViewPageComponent = () => {
  const [tableData, setTableData] = useState<DeliveryProjectWithActions[]>([]);
  const [key, refetchDeliveryProject] = useReducer(i => {
    return i + 1;
  }, 0);

  const errorApi = useApi(errorApiRef);
  const client = useApi(deliveryProjectApiRef);

  const getAllDeliveryProjects = async () => {
    try {
      const data = await client.getDeliveryProjects();
      setTableData(
        data.map(d => ({
          ...d,
          title: deliveryProjectDisplayName(d),
          actions: (
            <EditDeliveryProjectButton
              variant="contained"
              color="default"
              deliveryProject={d}
              data-testid={`delivery-project-edit-button-${d.id}`}
              onEdited={refetchDeliveryProject}
            >
              Edit
            </EditDeliveryProjectButton>
          ),
        })),
      );
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  useEffect(() => {
    getAllDeliveryProjects();
  }, [key]);

  const columns: TableColumn<DeliveryProjectWithActions>[] = [
    {
      title: 'Title',
      highlight: true,
      field: 'title',
      type: 'string',
    },
    {
      title: 'Alias',
      field: 'alias',
      highlight: false,
      type: 'string',
    },

    {
      title: 'Delivery Programme',
      field: 'delivery_programme_name',
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
        <ContentHeader title="Delivery Projects">
          <CreateDeliveryProjectButton
            variant="contained"
            size="large"
            color="primary"
            data-testid="delivery-project-add-button"
            startIcon={<AddBoxIcon />}
            onCreated={refetchDeliveryProject}
          >
            Add Delivery Project
          </CreateDeliveryProjectButton>
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the
            Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Typography paragraph>
          View or add Delivery Projects to the Azure Developer Platform.
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
