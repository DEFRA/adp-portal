import React, { useState, useReducer } from 'react';
import {
  Content,
  ContentHeader,
  Page,
  TableColumn,
} from '@backstage/core-components';
import { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';
import { Button, Grid } from '@material-ui/core';
import AddProgrammeAdmin from './AddProgrammeAdmin';
import { DefaultTable } from '@internal/plugin-adp/src/utils/Table';
import { ActionsModal } from '@internal/plugin-adp/src/utils/ActionsModal';
import { useProgrammeManagersList } from '@internal/plugin-adp/src/hooks/useProgrammeManagersList';
import { ProgrammeAdminFormFields } from './ProgrammeAdminFormFields';

export const ProgrammeAdminViewPageComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tableData, setTableData] = useState<DeliveryProgrammeAdmin[]>([]);
  const [formData, setFormData] = useState({});
  const [key, refetchProgrammeAdmin] = useReducer(i => {
    return i + 1;
  }, 0);

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

  //TODO: getAllProgrammeManagersById

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
      field: 'contact',
      highlight: false,
      type: 'string',
    },

    {
      title: 'role',
      field: 'role',
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
      render: (rowData: any) => {
        const data = rowData as DeliveryProgrammeAdmin;
        return (
          //  TODO: Add permission
          <Button
            variant="contained"
            color="default"
            onClick={() => handleEdit(data)}
            data-testid={`programme-admin-edit-button-${data.id}`}
          >
            Edit
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
