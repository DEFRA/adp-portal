import React, { useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import {
  alertApiRef,
  discoveryApiRef,
  errorApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { DeliveryProjectClient } from './api/DeliveryProjectClient';
import AddBoxIcon from '@mui/icons-material/AddBox';
import {
  DeliveryProject,
  adpProjectCreatePermission,
} from '@internal/plugin-adp-common';
import { useDeliveryProgrammesList } from '../../hooks/useDeliveryProgrammesList';
import { deliveryProjectFormFields } from './deliveryProjectFormFields';
import { CreateDeliveryProjectModal } from './CreateDeliveryProjectModal';
import {
  isCodeUnique,
  isNameUnique,
} from '../../utils/DeliveryProject/DeliveryProjectUtils';
import { usePermission } from '@backstage/plugin-permission-react';

interface CreateDeliveryProjectProps {
  refetchDeliveryProject: () => void;
}

const CreateDeliveryProject: React.FC<CreateDeliveryProjectProps> = ({
  refetchDeliveryProject,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);

  const programmesList = useDeliveryProgrammesList();
  const deliveryProgrammeOptions = programmesList.map(x => x.dropdownItem);
  const deliveryProgrammes = programmesList.map(x => x.programme);

  const deliveryProjectClient = new DeliveryProjectClient(
    discoveryApi,
    fetchApi,
  );

  const { allowed: allowedToCreateAdpProject } = usePermission({
    permission: adpProjectCreatePermission,
  });

  type PartialDeliveryProject = Partial<DeliveryProject>;
  const initialValues: PartialDeliveryProject = {
    team_type: 'delivery',
    namespace: '',
  };
  const [formValues, setFormValues] = useState(initialValues);
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormValues({
      team_type: 'delivery',
      namespace: '',
    });
  };

  useEffect(() => {
    setFormValues(values => {
      const programmeCode = deliveryProgrammes.find(
        p => p.id === values.delivery_programme_id,
      )?.delivery_programme_code;
      if (programmeCode && values.delivery_project_code) {
        const newValues = {
          ...values,
          namespace: `${programmeCode}-${values.delivery_project_code}`,
        };
        return newValues;
      }
      const result = {
        ...values,
        namespace: '',
      };
      return result;
    });
  }, [formValues.delivery_project_code, formValues.delivery_programme_id]);

  const handleSubmit = async (deliveryProject: DeliveryProject) => {
    try {
      const data = await deliveryProjectClient.getDeliveryProjects();

      if (!isNameUnique(data, deliveryProject.title, deliveryProject.id)) {
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
          data,
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
      await deliveryProjectClient.createDeliveryProject(deliveryProject);
      alertApi.post({
        message: 'Delivery Project created successfully.',
        severity: 'success',
        display: 'transient',
      });
      refetchDeliveryProject();
      handleCloseModal();
    } catch (e: any) {
      alertApi.post({
        message: e.message,
        severity: 'error',
        display: 'permanent',
      });
      errorApi.post(e);
    }
  };

  return (
    <>
      {allowedToCreateAdpProject && (
        <Button
          variant="contained"
          size="large"
          color="primary"
          startIcon={<AddBoxIcon />}
          onClick={handleOpenModal}
          data-testid="create-delivery-project-button"
        >
          Add Delivery Project
        </Button>
      )}
      {isModalOpen && (
        <CreateDeliveryProjectModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          initialValues={{ ...initialValues, namespace: formValues.namespace }}
          mode="create"
          fields={deliveryProjectFormFields({
            deliveryProgrammeOptions,
            onProjectCodeChange(event) {
              setFormValues(values => ({
                ...values,
                delivery_project_code: event.target.value,
              }));
            },
            onProgrammeIdChange(event) {
              setFormValues(values => ({
                ...values,
                delivery_programme_id: event.target.value,
              }));
            },
          })}
        />
      )}
    </>
  );
};

export default CreateDeliveryProject;
