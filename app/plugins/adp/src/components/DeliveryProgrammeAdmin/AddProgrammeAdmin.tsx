import React, {useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { ProgrammeAdminModal } from './ProgrammeAdminModal';
import { ProgrammeAdminFormFields } from './ProgrammeAdminFormFields';
import { useProgrammeManagersList } from '@internal/plugin-adp/src/hooks/useProgrammeManagersList';
import { DeliveryProgrammeAdmin } from '@internal/plugin-adp-common';

interface AddProgrammeAdminProps {
  refetchProgrammeAdmin: () => void;
}

const AddProgrammeAdmin: React.FC<AddProgrammeAdminProps> = ({
  refetchProgrammeAdmin: refetchProgrammeAdmin,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialValues: Partial<DeliveryProgrammeAdmin> = {
    delivery_programme_id: 'delivery programme name', //TODO: Set initial value correctly
  };

  const [formValues, setFormValues] = useState(initialValues);

  const getProgrammeManagerDropDown = useProgrammeManagersList(); //TODO: Rename programme managers to programme admins

  const getOptionFields = () => {
    return ProgrammeAdminFormFields.map(field => {
      if (field.name === 'programme_managers') {
        return { ...field, options: getProgrammeManagerDropDown };
      }
      return field;
    });
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormValues({
      delivery_programme_id: 'delivery programme name', //TODO: Set initial value correctly
    });
  };

  useEffect(() => {
    // TODO: setFormValues using the name value in groups
  }, [formValues.delivery_programme_id]);

  const handleSubmit = async () => {
    // TODO: handle submit
  };

  return (
    <>
      {/* TODO: Add Permission Condition here */}
      <Button
        variant="contained"
        size="large"
        color="primary"
        startIcon={<AddBoxIcon />}
        onClick={handleOpenModal}
        data-testid="add-programme-admin-button"
      >
        Add Programme Admin
      </Button>

      {isModalOpen && (
        <ProgrammeAdminModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          initialValues={{...initialValues}}
          // TODO: Refactor actions modal - 'create', 'edit' mode as it displays those words when adding programme admin
          mode="create" 
          fields={getOptionFields()}
        />
      )}
    </>
  );
};

export default AddProgrammeAdmin;
