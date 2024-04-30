import React, { useState, useEffect, useReducer } from 'react';
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
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';
import { DeliveryProgramme } from '@internal/plugin-adp-common';
import { DeliveryProgrammeClient } from './api/DeliveryProgrammeClient';
import { DeliveryProgrammeApi } from './api/DeliveryProgrammeApi';
import { CreateDeliveryProgrammeButton } from './CreateDeliveryProgrammeButton';
import { EditDeliveryProgrammeButton } from './EditDeliveryProgrammeButton';

export const DeliveryProgrammeViewPageComponent = () => {
  const [tableData, setTableData] = useState<DeliveryProgramme[]>([]);
  const [key, refetchDeliveryProgramme] = useReducer(i => {
    return i + 1;
  }, 0);

  const errorApi = useApi(errorApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const deliveryprogClient: DeliveryProgrammeApi = new DeliveryProgrammeClient(
    discoveryApi,
    fetchApi,
  );

  const getAllDeliveryProgrammes = async () => {
    try {
      const data = await deliveryprogClient.getDeliveryProgrammes();
      setTableData(data);
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  useEffect(() => {
    getAllDeliveryProgrammes();
  }, [key]);

  const columns: TableColumn<DeliveryProgramme>[] = [
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
      title: 'Arms Length Body',
      field: 'arms_length_body_id_name',
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
      render: data => (
        <EditDeliveryProgrammeButton
          variant="contained"
          color="default"
          deliveryProgramme={data}
          data-testid={`delivery-programme-edit-button-${data.id}`}
        >
          Edit
        </EditDeliveryProgrammeButton>
      ),
    },
  ];

  return (
    <Page themeId="tool">
      <Header
        title="Azure Development Platform: Onboarding"
        subtitle="ADP Platform Configuration"
      />
      <Content>
        <ContentHeader title="Delivery Programmes">
          <CreateDeliveryProgrammeButton
            variant="contained"
            size="large"
            color="primary"
            startIcon={<AddBoxIcon />}
            onCreated={refetchDeliveryProgramme}
          >
            Add Delivery Programme
          </CreateDeliveryProgrammeButton>
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the
            Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Typography paragraph>
          View or add Delivery Programmes to the Azure Developer Platform.
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
