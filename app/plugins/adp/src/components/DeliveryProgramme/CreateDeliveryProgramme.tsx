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
import { DeliveryProgrammeClient } from './api/DeliveryProgrammeClient';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { DeliveryProgramme } from '@internal/plugin-adp-common';
import { useArmsLengthBodyList } from '../../hooks/useArmsLengthBodyList';

import { useProgrammeManagersList } from '../../hooks/useProgrammeManagersList';
import { DeliveryProgrammeFormFields } from './DeliveryProgrammeFormFields';

interface CreateDeliveryProgrammeProps {
  refetchDeliveryProgramme: () => void;
}

const CreateDeliveryProgramme: React.FC<CreateDeliveryProgrammeProps> = ({
  refetchDeliveryProgramme,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);
  const getArmsLengthBodyDropDown = useArmsLengthBodyList();
  const getProgrammeManagerDropDown = useProgrammeManagersList();

  const deliveryprogClient = new DeliveryProgrammeClient(
    discoveryApi,
    fetchApi,
  );

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const getAlbOptionFields = () => {
    return DeliveryProgrammeFormFields.map(field => {
      if (field.name === 'arms_length_body') {
        return { ...field, options: getArmsLengthBodyDropDown };
      } else if (field.name === 'programme_managers') {
        return { ...field, options: getProgrammeManagerDropDown };
      }
      return field;
    });
  };

  const handleSubmit = async (deliveryProgramme: DeliveryProgramme) => {
    try {
      await deliveryprogClient.createDeliveryProgramme(deliveryProgramme);
      alertApi.post({
        message: 'Delivery Programme created successfully.',
        severity: 'success',
        display: 'transient',
      });
      refetchDeliveryProgramme();
      handleCloseModal();
    } catch (e: any) {
      alertApi.post({
        message: `The title '${deliveryProgramme.title}' is already in use. Please choose a different title.`,
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
        data-testid="create-delivery-programme-button"
      >
        Add Delivery Programme
      </Button>

      {isModalOpen && (
        <ActionsModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          initialValues={{}}
          mode="create"
          fields={getAlbOptionFields()}
        />
      )}
    </>
  );
};

export default CreateDeliveryProgramme;
