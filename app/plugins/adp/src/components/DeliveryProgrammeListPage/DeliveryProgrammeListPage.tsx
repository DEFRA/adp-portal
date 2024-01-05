import React, { useReducer, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import {
  Grid,
  TextField,
  Button,
  Dialog,
  Box,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
} from '@backstage/core-components';
import {
  DeliveryProgramme,
  DeliveryProgrammeList,
} from '../DeliveryProgrammeList';
import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';

export const DeliveryProgrammeListPage = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const { fetch } = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);
  const [key, refetchDeliveryProgrammes] = useReducer(i => i + 1, 0);
  const [editElement, setEdit] = useState<DeliveryProgramme | undefined>();

  const handleAdd = async (title: string) => {
    try {
      const response = await fetch(
        `${await discoveryApi.getBaseUrl('adp')}/deliveryProgrammes`,
        {
          method: 'POST',
          body: JSON.stringify({ title }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        const { error } = await response.json();
        alertApi.post({
          message: error.message,
          severity: 'error',
        });
        return;
      }
      refetchDeliveryProgrammes();
    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    }
  };

  const handleEdit = async (deliveryProgramme: DeliveryProgramme) => {
    setEdit(undefined);
    try {
      console.log(deliveryProgramme);
      const response = await fetch(
        `${await discoveryApi.getBaseUrl('adp')}/deliveryProgrammes`,
        {
          method: 'PUT',
          body: JSON.stringify({ ...deliveryProgramme }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      if (!response.ok) {
        const { error } = await response.json();
        alertApi.post({
          message: error.message,
          severity: 'error',
        });
        return;
      }
      refetchDeliveryProgrammes();
    } catch (e: any) {
      alertApi.post({ message: e.message, severity: 'error' });
    }
  };

  return (
    <Page themeId="tool">
      <Header
        title="ADP Data"
        subtitle="Manage organization data within the Azure Developer Platform"
      >
      </Header>
      <Content>
        <ContentHeader title="Delivery Programmes">
          <SupportButton>A description of your plugin goes here.</SupportButton>
        </ContentHeader>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <AddDeliveryProgramme onAdd={handleAdd} />
          </Grid>
          <Grid item>
            <DeliveryProgrammeList key={key} onEdit={setEdit} />
          </Grid>
        </Grid>
      </Content>
      {!!editElement && (
        <EditModal
          deliveryProgramme={editElement}
          onSubmit={handleEdit}
          onCancel={() => setEdit(undefined)}
          onClose={() => setEdit(undefined)}
          open
        />
      )}
    </Page>
  );
};

function AddDeliveryProgramme({ onAdd }: { onAdd: (title: string) => any }) {
  const title = useRef('');

  return (
    <>
      <Typography variant="body1">Add deliveryProgramme</Typography>
      <Box
        component="span"
        alignItems="flex-end"
        display="flex"
        flexDirection="row"
      >
        <TextField
          placeholder="Write something here..."
          onChange={e => (title.current = e.target.value)}
        />
        <Button variant="contained" onClick={() => onAdd(title.current)}>
          Add
        </Button>
      </Box>
    </>
  );
}

function EditModal({
  deliveryProgramme,
  onCancel,
  onSubmit,
  onClose,
  open,
}: {
  deliveryProgramme?: DeliveryProgramme;
  onSubmit(t: DeliveryProgramme): any;
  onCancel(): any;
  open: boolean;
  onClose: () => void;
}) {
  const defaultValues = {
    ...deliveryProgramme,
  };

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({ defaultValues });

  const [saving, saveDeliveryProgramme] = useAsyncFn(
    formValues => onSubmit({ ...formValues }),
    [onSubmit],
  );

  const closeDialog = () => {
    if (!saving.loading) {
      onClose();
      reset(defaultValues);
    }
  };

  return (
    <Dialog fullWidth maxWidth="xs" onClose={closeDialog} open={open}>
      <DialogTitle id="form-dialog-title">
        Edit Delivery Programme Details
      </DialogTitle>
      <DialogContent>
        <Controller
          name="name"
          control={control}
          rules={{
            required: true,
          }}
          render={({ field }) => (
            <TextField
              {...field}
              disabled={saving.loading}
              error={!!errors.name}
              helperText={errors.name?.message}
              placeholder="Enter name of the Delivery Programme"
              label="Name"
              margin="dense"
              fullWidth
              required
              type="text"
            />
          )}
        />
        <Controller
          name="title"
          control={control}
          rules={{
            required: true,
          }}
          render={({ field }) => (
            <TextField
              {...field}
              disabled={saving.loading}
              error={!!errors.title}
              helperText={errors.title?.message}
              placeholder="Enter Title"
              label="Title"
              margin="dense"
              fullWidth
              required
              type="text"
            />
          )}
        />
        <Controller
          name="armLengthBody"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              disabled={saving.loading}
              error={!!errors.armLengthBody}
              helperText={errors.armLengthBody?.message}
              placeholder="Select Arm Length Body fromt the list."
              label="Arm Length Body"
              margin="dense"
              fullWidth
              type="text"
            />
          )}
        />
        <Controller
          name="deliveryProgrammeCode"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              disabled={saving.loading}
              error={!!errors.deliveryProgrammeCode}
              helperText={errors.deliveryProgrammeCode?.message}
              placeholder="Enter Delivery Programme Code."
              label="Delivery Programme Code"
              margin="dense"
              fullWidth
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              disabled={saving.loading}
              error={!!errors.description}
              helperText={errors.description?.message}
              placeholder="Enter Description."
              label="Description"
              margin="dense"
              fullWidth
              type="text"
            />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit(saveDeliveryProgramme)} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
