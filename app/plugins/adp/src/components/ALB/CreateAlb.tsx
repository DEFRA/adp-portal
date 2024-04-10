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
import { ArmsLengthBodyClient } from './api/AlbClient';
import AddBoxIcon from '@mui/icons-material/AddBox';
import { albFormFields } from './AlbFormFields';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  adpProgrammmeCreatePermission,
  ArmsLengthBody,
} from '@internal/plugin-adp-common';

interface CreateAlbProps {
  refetchArmsLengthBody: () => void;
}

const CreateAlb: React.FC<CreateAlbProps> = ({ refetchArmsLengthBody }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const alertApi = useApi(alertApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const errorApi = useApi(errorApiRef);
  const fields = albFormFields;

  const albClient = new ArmsLengthBodyClient(discoveryApi, fetchApi);

  const { allowed } = usePermission({
    permission: adpProgrammmeCreatePermission,
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (armsLengthBody: ArmsLengthBody) => {
    try {
      await albClient.createArmsLengthBody(armsLengthBody);
      alertApi.post({
        message: 'ALB created successfully.',
        severity: 'success',
        display: 'transient',
      });
      refetchArmsLengthBody();
      handleCloseModal();
    } catch (e: any) {
      alertApi.post({
        message: `The title '${armsLengthBody.title}' is already in use. Please choose a different name.`,
        severity: 'error',
        display: 'permanent',
      });
      errorApi.post(e);
    }
  };

  return (
    <>
      {allowed && (
        <Button
          variant="contained"
          size="large"
          color="primary"
          startIcon={<AddBoxIcon />}
          onClick={handleOpenModal}
          data-testid="create-alb-button"
        >
          Add ALB
        </Button>
      )}
      {isModalOpen && (
        <ActionsModal
          open={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
          initialValues={{}}
          mode="create"
          fields={fields}
        />
      )}
    </>
  );
};

export default CreateAlb;
