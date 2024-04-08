import React, { useState, useEffect, useReducer } from 'react';
import { Button, Typography } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  TableColumn,
} from '@backstage/core-components';
import { DefaultTable } from '../../utils/Table';
import { ActionsModal } from '../../utils/ActionsModal';
import {
  useApi,
  discoveryApiRef,
  fetchApiRef,
  alertApiRef,
  errorApiRef,
} from '@backstage/core-plugin-api';
import {
  DeliveryProject,
  adpProjectCreatePermission,
} from '@internal/plugin-adp-common';
import CreateDeliveryProject from './CreateDeliveryProject';
import { DeliveryProjectClient } from './api/DeliveryProjectClient';
import { DeliveryProjectApi } from './api/DeliveryProjectApi';
import { DeliveryProjectFormFields } from './DeliveryProjectFormFields';
import { useDeliveryProgrammesList } from '../../hooks/useDeliveryProgrammesList';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  isCodeUnique,
  isNameUnique,
} from '../../utils/DeliveryProject/DeliveryProjectUtils';

export const DeliveryProjectViewPageComponent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [tableData, setTableData] = useState<DeliveryProject[]>([]);
  const [key, refetchDeliveryProject] = useReducer(i => {
    return i + 1;
  }, 0);

  const alertApi = useApi(alertApiRef);
  const errorApi = useApi(errorApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const programmesList = useDeliveryProgrammesList();
  const deliveryProgrammeDropDown = programmesList.map(x => x.dropdownItem);

  const deliveryProjectClient: DeliveryProjectApi = new DeliveryProjectClient(
    discoveryApi,
    fetchApi,
  );

  const { allowed } = usePermission({
    permission: adpProjectCreatePermission,
  });

  const getAllDeliveryProjects = async () => {
    try {
      const data = await deliveryProjectClient.getDeliveryProjects();
      setTableData(data);
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  useEffect(() => {
    getAllDeliveryProjects();
  }, [key]);

  const handleEdit = async (deliveryProject: DeliveryProject) => {
    try {
      const project = await deliveryProjectClient.getDeliveryProjectById(
        deliveryProject.id,
      );
      setFormData(project);
      setIsModalOpen(true);
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  const handleCloseModal = () => {
    setFormData({});
    setIsModalOpen(false);
  };

  const handleUpdate = async (deliveryProject: DeliveryProject) => {
    if (!isNameUnique(tableData, deliveryProject.title, deliveryProject.id)) {
      setIsModalOpen(true);
      alertApi.post({
        message: `The title '${deliveryProject.title}' is already in use. Please choose a different title.`,
        severity: 'error',
        display: 'permanent',
      });
      return;
    }
    if (
      !isCodeUnique(
        tableData,
        deliveryProject.delivery_project_code,
        deliveryProject.id,
      )
    ) {
      setIsModalOpen(true);
      alertApi.post({
        message: `The service code '${deliveryProject.delivery_project_code}' is already in use. Please choose a different service code.`,
        severity: 'error',
        display: 'permanent',
      });
      return;
    }

    try {
      await deliveryProjectClient.updateDeliveryProject(deliveryProject);
      alertApi.post({
        message: `Updated`,
        severity: 'success',
        display: 'transient',
      });
      refetchDeliveryProject();
    } catch (e: any) {
      errorApi.post(e);
    }
  };

  const getFieldsAndOptions = () => {
    return DeliveryProjectFormFields.map(field => {
      if (field.name === 'delivery_programme_id') {
        return { ...field, options: deliveryProgrammeDropDown };
      }
      if (field.name === 'team_type') {
        const options = [
          { label: 'Delivery Team', value: 'delivery' },
          { label: 'Platform Team', value: 'platform' },
        ];
        return { ...field, options: options };
      }
      if (field.name === 'namespace') {
        return { ...field, disabled: true };
      }
      return field;
    });
  };

  const columns: TableColumn[] = [
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
      render: (rowData: any) => {
        const data = rowData as DeliveryProject;
        return (
          allowed && (
            <Button
              variant="contained"
              color="default"
              onClick={() => handleEdit(data)}
              data-testid={`delivery-project-edit-button-${data.id}`}
            >
              Edit
            </Button>
          )
        );
      },
    },
  ];

  return (
    <Page themeId="tool">
      <Header
        title="Azure Development Platform: Data"
        subtitle="ADP Platform Configuration"
      />
      <Content>
        <ContentHeader title="Delivery Projects">
          <CreateDeliveryProject
            refetchDeliveryProject={refetchDeliveryProject}
          />
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

        {isModalOpen && allowed && (
          <ActionsModal
            open={isModalOpen}
            onClose={handleCloseModal}
            onSubmit={handleUpdate}
            initialValues={formData}
            mode="edit"
            fields={getFieldsAndOptions()}
          />
        )}
      </Content>
    </Page>
  );
};
