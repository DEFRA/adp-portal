import React from 'react';
import { Content, Header, Page } from '@backstage/core-components';
import { Alert, AlertTitle } from '@material-ui/lab';

export const ErrorPage = () => {
  return (
    <Page themeId="home">
      <Header title="ADP Portal" />
      <Content>
        <Alert severity="error">
          <AlertTitle>
            Unfortunately, there is a problem with your request
          </AlertTitle>
          <p>
            <b>Your request has been blocked.</b> Please contact the site
            administrator or the Defra helpdesk with the following information.
          </p>
          <p>
            <b>Tracking Request ID</b>: {'{{azure-ref}}'}
          </p>
        </Alert>
      </Content>
    </Page>
  );
};
