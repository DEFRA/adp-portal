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
import { DeliveryProgramme } from '@internal/plugin-adp-common';
import { deliveryProgrammeApiRef } from './api/DeliveryProgrammeApi';
import { CreateDeliveryProgrammeButton } from './CreateDeliveryProgrammeButton';
import { EditDeliveryProgrammeButton } from './EditDeliveryProgrammeButton';

type DeliveryProgrammeWithActions = DeliveryProgramme & {
  actions: ReactNode;
};

export const DeliveryProgrammeViewPageComponent = () => {
  const [tableData, setTableData] = useState<DeliveryProgrammeWithActions[]>(
    [],
  );
  const [key, refetchDeliveryProgramme] = useReducer(i => {
    return i + 1;
  }, 0);

  const errorApi = useApi(errorApiRef);
  const client = useApi(deliveryProgrammeApiRef);

  const getAllDeliveryProgrammes = async () => {
    try {
      const data = await client.getDeliveryProgrammes();
      setTableData(
        data.map(d => ({
          ...d,
          actions: (
            <EditDeliveryProgrammeButton
              variant="contained"
              color="default"
              deliveryProgramme={d}
              data-testid={`delivery-programme-edit-button-${d.id}`}
              onEdited={refetchDeliveryProgramme}
            >
              Edit
            </EditDeliveryProgrammeButton>
          ),
        })),
      );
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  useEffect(() => {
    getAllDeliveryProgrammes();
  }, [key]);

  const columns: TableColumn<DeliveryProgrammeWithActions>[] = [
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
        <ContentHeader title="Delivery Programmes">
          <CreateDeliveryProgrammeButton
            variant="contained"
            size="large"
            color="primary"
            data-testid="delivery-programme-add-button"
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
