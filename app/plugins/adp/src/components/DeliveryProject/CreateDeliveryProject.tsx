import React, { useState } from 'react';
import { Button } from '@material-ui/core';
import { ActionsModal } from '../../utils/ActionsModal';
import {
  alertApiRef,
  discoveryApiRef,
  errorApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { DeliveryProjectClient } from './api/DeliveryProjectClient';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { DeliveryProject } from '@internal/plugin-adp-common';
import { useDeliveryProgrammesList } from '../../hooks/useDeliveryProgrammesList';
import { DeliveryProjectFormFields } from './DeliveryProjectFormFields';

interface CreateDeliveryProjectProps {
  refetchDeliveryProject: () => void;
}

const CreateDeliveryProject: React.FC<CreateDeliveryProjectProps> = ({
  refetchDeliveryProject: refetchDeliveryProject,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);
  const getDeliveryProgrammeDropDown = useDeliveryProgrammesList();

  const deliveryProjectClient = new DeliveryProjectClient(
    discoveryApi,
    fetchApi,
  );

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getOptionFields = () => {
    return DeliveryProjectFormFields.map(field => {
      if (field.name === 'delivery_programme_id') {
        return { ...field, options: getDeliveryProgrammeDropDown };
      }
      return field;
    });
  };

  const handleSubmit = async (deliveryProject: DeliveryProject) => {
    try {
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
        message: `The title '${deliveryProject.title}' is already in use. Please choose a different title.`,
        severity: 'error',
        display: 'permanent',
      });
      errorApi.post(e);
    }
  };

  return (
    <>
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

      {isModalOpen && (
        <ActionsModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          initialValues={{}}
          mode="create"
          fields={getOptionFields()}
        />
      )}
    </>
  );
};

export default CreateDeliveryProject;
