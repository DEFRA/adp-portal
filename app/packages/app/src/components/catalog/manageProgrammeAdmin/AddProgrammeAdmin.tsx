import React, { useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import AddBoxIcon from '@mui/icons-material/AddBox';
import {
  alertApiRef,
  discoveryApiRef,
  errorApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { ProgrammeAdminModal } from './ProgrammeAdminModal';
import { ProgrammeAdminFormFields } from './ProgrammeAdminFormFields';
import { useProgrammeManagersList } from '@internal/plugin-adp/src/hooks/useProgrammeManagersList';

interface AddProgrammeAdminProps {
  refetchProgrammeAdmin: () => void;
}

export const AddProgrammeAdmin: React.FC<AddProgrammeAdminProps> = ({
  refetchProgrammeAdmin: refetchProgrammeAdmin,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);

  const getProgrammeManagerDropDown = useProgrammeManagersList();

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
  };

  const handleSubmit = async () => {};

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
          initialValues={{}}
          mode="create"
          fields={getOptionFields()}
        />
      )}
    </>
  );
};
