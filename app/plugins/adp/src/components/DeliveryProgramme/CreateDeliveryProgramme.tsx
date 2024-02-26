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
import { DeliveryProgrammeFormFields } from './DeliveryProgrammeFormFields';
import { DeliveryProgramme } from '@internal/plugin-adp-common';
import { useArmsLengthBodyList} from '../../hooks/useArmsLengthBodyList'
import { useEntities } from '../../hooks/useEntities';


interface CreateDeliveryProgrammeProps {
  refetchDeliveryProgramme: () => void;
}


const CreateDeliveryProgramme: React.FC<CreateDeliveryProgrammeProps> = ({refetchDeliveryProgramme}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);
  const getArmsLengthBodyDropDown = useArmsLengthBodyList();
  const getEntitiesChip = useEntities()
  

  const deliveryprogClient = new DeliveryProgrammeClient(discoveryApi, fetchApi);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  

  const handleSubmit = async (deliveryProgramme: DeliveryProgramme) => {
    console.log("original submission" , deliveryProgramme)
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
        message: `The title '${deliveryProgramme.title}' is already in use. Please choose a different name.`,
        severity: 'error',
        display: 'permanent',
      });
      errorApi.post(e);
    }
  };

  // const getAlbOptionFields = () => {
  //   return DeliveryProgrammeFormFields.map(field => {
  //     if (field.name === 'arms_length_body') {
  //       return { ...field, options: getArmsLengthBodyDropDown };
  //     }
  //     return field;
  //   });
  // };

  const prepareFormFields = () => {
    const albOptions = getArmsLengthBodyDropDown; 
    const programmeManagerOptions = getEntitiesChip; 
  
    return DeliveryProgrammeFormFields.map(field => {
      if (field.name === 'arms_length_body') {
        return { ...field, options: albOptions };
      } else if (field.name === 'programme_manager') {
 
        return { ...field, options: programmeManagerOptions };
      }
      return field;
    });
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
          fields={prepareFormFields()}
        />
      )}
    </>
  );
};


export default CreateDeliveryProgramme;