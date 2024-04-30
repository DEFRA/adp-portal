import React, { useState, useReducer, useEffect } from 'react';
import {
  Content,
  ContentHeader,
  Page,
  TableColumn,
} from '@backstage/core-components';
import { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { Button, Grid } from '@material-ui/core';
import AddProgrammeAdmin from './AddProgrammeAdmin';
import { DefaultTable } from '@internal/plugin-adp/src/utils';
import { ActionsModal } from '@internal/plugin-adp/src/utils';
import { useProgrammeManagersList } from '@internal/plugin-adp/src/hooks/useProgrammeManagersList';
import { ProgrammeAdminFormFields } from './ProgrammeAdminFormFields';
import { errorApiRef, useApi } from '@backstage/core-plugin-api';
import { deliveryProgrammeAdminApiRef } from './api';
import { useEntity } from '@backstage/plugin-catalog-react';

export const DeliveryProgrammeAdminViewPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableData, setTableData] = useState<DeliveryProgrammeAdmin[]>([]);
  const [formData, setFormData] = useState({});
  const [key, refetchProgrammeAdmin] = useReducer(i => {
    return i + 1;
  }, 0);
  const { entity } = useEntity();

  const deliveryProgrammeAdminApi = useApi(deliveryProgrammeAdminApiRef);
  const errorApi = useApi(errorApiRef);

  const getProgrammeManagerDropDown = useProgrammeManagersList();
  const getOptionFields = () => {
    return ProgrammeAdminFormFields.map(field => {
      if (field.name === 'programme_managers') {
        return {
          ...field,
          options: getProgrammeManagerDropDown,
        };
      }
      return field;
    });
  };

  const handleCloseModal = () => {
    setFormData({});
    setIsModalOpen(false);
  };

  // TODO: Refactor to use a hook
  const getDeliveryProgrammeAdmins = async () => {
    try {
      const deliveryProgrammeId = entity.metadata.annotations!['adp.defra.gov.uk/delivery-programme-id'];
      const data = await deliveryProgrammeAdminApi.getByDeliveryProgrammeId(deliveryProgrammeId);
      setTableData(data);
    } catch (error: any) {
      errorApi.post(error);
    }
  }

  useEffect(() => {
    getDeliveryProgrammeAdmins();
  }, [key]);

  const handleEdit = async (programmeManager: DeliveryProgrammeAdmin) => {
    // TODO: handle edit
  };

  const handleUpdate = async (programmeManager: DeliveryProgrammeAdmin) => {
    // TODO: handle update
  };

  const columns: TableColumn[] = [
    {
      title: 'Name',
      field: 'name',
      highlight: true,
      type: 'string',
    },
    {
      title: 'Contact',
      field: 'email',
      highlight: false,
      type: 'string',
    },

    {
      title: 'role',
      field: 'role',
      highlight: false,
      type: 'string',
      render: () => (
        <>Delivery Programme Admin</>
      )
    },
    {
      title: 'Updated At',
      field: 'updated_at',
      highlight: false,
      type: 'datetime',
    },

    {
      highlight: true,
      render: (rowData: any) => {
        const data = rowData as DeliveryProgrammeAdmin;
        return (
          //  TODO: Add permission
          <Button
            variant="contained"
            color="secondary"
            data-testid={`programme-admin-edit-button-${data.id}`}
          >
            Remove
          </Button>
        );
      },
    },
  ];

  return (
    <Page themeId="tool">
      <Content>
        <ContentHeader title="Delivery Programme Admins">
          {/* TODO: Add permissions */}
          <AddProgrammeAdmin refetchProgrammeAdmin={refetchProgrammeAdmin} />
        </ContentHeader>
        <Grid item>
          <div>
            <DefaultTable
              data={tableData}
              columns={columns}
              title="View all"
              isCompact={true}
            />
            {/* TODO: Add permissions */}
            <ActionsModal
              open={isModalOpen}
              onClose={handleCloseModal}
              onSubmit={handleUpdate}
              initialValues={formData}
              mode="edit"
              fields={getOptionFields()}
            />
          </div>
        </Grid>
      </Content>
    </Page>
  );
};
