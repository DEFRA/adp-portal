import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import {
  Button,
  Grid,
  Card,
  TextField,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';

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
  sameAsCreator: boolean;
};

export const CreateAlbComponent = () => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = data => {
    {
      /* TODO: add logic for post req to add ALB to database */
    }
    console.log(data);
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;

    if (isChecked) {
      {
        /* TODO: add logic to retrieve username & email from Azure Login */
      }
    } else {
      setValue('creatorusername', '');
    }
  };

  return (
    <Page themeId="tool">
      <Header title="Azure Development Platform: Data" subtitle="ADP Data" />
      <Content>
        <ContentHeader title="Add Arms Length Body">
          <SupportButton>
            View or manage units within the DEFRA delivery organization on the
            Azure Developer Platform.
          </SupportButton>
        </ContentHeader>
        <Card style={{ padding: '16px', border: '1px solid #ddd' }}>
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={4}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      {...register('sameAsCreator')}
                      onChange={handleCheckboxChange}
                      color="primary"
                    />
                  }
                  label="Are you also the owner?"
                />
              </Grid>

              <Grid item xs={6}></Grid>

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

              {/* TODO: add logic to validate uniqueness of name with database */}
              <Grid item xs={12}>
                <TextField
                  label="ALB Name"
                  {...register('albname', {
                    required: 'Please fill in this field.',
                    pattern: {
                      value: /^([a-zA-Z0-9]+[-_.]?)*[a-zA-Z0-9]+$/,
                      message:
                        'Invalid ALB name format. Use letters, numbers, or "-", "_", "." as separators.',
                    },
                    minLength: {
                      value: 1,
                      message: 'ALB name must be at least 1 character long.',
                    },
                    maxLength: {
                      value: 63,
                      message: 'ALB name must be at most 63 characters long.',
                    },
                  })}
                  fullWidth
                  helperText={
                    <>
                      This must be a unique - use letters, numbers, or
                      separators such as "_","-"."
                    </>
                  }
                />
                {errors.albname && <p role="alert">{errors.albname.message}</p>}
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="ALB Short-Form Name"
                  {...register('albshortformname')}
                  fullWidth
                  helperText="Optional - a short form name to identify the body"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  id="outlined-basic"
                  label="ALB Description"
                  variant="outlined"
                  {...register('description', {
                    required: 'Please fill in this field.',
                    maxLength: {
                      value: 200,
                      message: 'Description must not exceed 200 characters.',
                    },
                  })}
                  multiline
                  fullWidth
                  maxRows={6}
                  helperText="Max 200 chars"
                />
                {errors.description && (
                  <p role="alert">{errors.description.message}</p>
                )}
              </Grid>

              <Grid
                item
                xs={12}
                style={{ display: 'flex', justifyContent: 'flex-end' }}
              >
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
