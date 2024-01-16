import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button, Grid, Card, TextField } from '@material-ui/core';

import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
} from '@backstage/core-components';

type Inputs = {
  creatorusername: string;
  creatoremail: string;
  ownerusername: string;
  owneremail: string;
  albname: string;
  albshortformname: string;
  description: string;
};

export const CreateAlbComponent = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    // Handle your form submission logic here
    console.log(data);
  };

  return (
    <Page themeId="tool">
      <Header title="Azure Development Platform: Data" subtitle="ADP Data" />
      <Content>
        <ContentHeader title="Add Arms Length Body">
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Card>
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <TextField
                  label="Creator Username"
                  {...register('creatorusername', {
                    required: 'Please fill in this field.',
                  })}
                  fullWidth
                />
                {errors.creatorusername && (
                  <p role="alert">{errors.creatorusername.message}</p>
                )}
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Creator Email"
                  {...register('creatoremail', {
                    required: 'Please fill in this field.',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Please enter a valid email address.',
                    },
                  })}
                  fullWidth
                />
                {errors.creatoremail && (
                  <p role="alert">{errors.creatoremail.message}</p>
                )}
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Owner Username"
                  {...register('ownerusername', {
                    required: 'Please fill in this field.',
                  })}
                  fullWidth
                />
                {errors.ownerusername && (
                  <p role="alert">{errors.ownerusername.message}</p>
                )}
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Owner Email"
                  {...register('owneremail', {
                    required: 'Please fill in this field.',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Please enter a valid email address.',
                    },
                  })}
                  fullWidth
                />
                {errors.owneremail && (
                  <p role="alert">{errors.owneremail.message}</p>
                )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="ALB Name"
                  {...register('albname', {
                    required: 'Please fill in this field.',
                  })}
                  fullWidth
                />
                {errors.albname && <p role="alert">{errors.albname.message}</p>}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="ALB Short-Form Name"
                  {...register('albshortformname')}
                  fullWidth
                />
                {errors.albshortformname && (
                  <p role="alert">{errors.albshortformname.message}</p>
                )}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="ALB Description"
                  {...register('description', {
                    required: 'Please fill in this field.',
                  })}
                  multiline
                  fullWidth
                />
                {errors.description && (
                  <p role="alert">{errors.description.message}</p>
                )}
              </Grid>

              <Grid item xs={12}>
                <Button type="submit" variant="contained" color="primary">
                  Submit
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      </Content>
    </Page>
  );
};
