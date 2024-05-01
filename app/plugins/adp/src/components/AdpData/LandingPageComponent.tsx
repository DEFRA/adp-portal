import React from 'react';
import { Typography } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
  ItemCardGrid,
} from '@backstage/core-components';
import { CardTemplate } from './CardComponent';

export const LandingPageComponent = () => (
  <Page themeId="tool">
    <Header
      title="Azure Development Platform: Onboarding"
      subtitle="ADP Onboarding"
    ></Header>
    <Content>
      <ContentHeader title="ADP Onboarding">
        <SupportButton>
          View or manage units within the DEFRA delivery organization on the
          Azure Developer Platform.
        </SupportButton>
      </ContentHeader>
      <Typography paragraph>
        View or add Arms Length Bodies, Delivery Programmes & Delivery Teams to
        the Azure Developer Platform.
      </Typography>
      <ItemCardGrid>
        <CardTemplate
          cardTitle="Arms Length Bodies"
          cardSubTitle="ADP"
          cardText="Arms Length Bodies (ALB's) are a specific category of central government public bodies that are administratively classified by the Cabinet Office. Each Arms Length Body may contain multiple delivery programmes."
          pathToView="arms-length-bodies"
        />
        <CardTemplate
          cardTitle="Delivery Programmes"
          cardSubTitle="ADP"
          cardText="Delivery Programmes coordinate and oversee multiple related delivery teams or projects to realise outcomes and benefits related to a strategic objective set by DEFRA or an Arms Length Body. Each delivery programme may contain multiple delivery teams."
          pathToView="delivery-programmes"
        />
        <CardTemplate
          cardTitle="Delivery Projects"
          cardSubTitle="ADP"
          cardText="Delivery Projects are responsible for creating and maintaining platform services to realise benefits and outcomes for delivery programmes through the Azure Developer Platform. Each delivery project must be part of a delivery programme and team members are able to scaffold platform services through this portal."
          pathToView="delivery-projects"
        />
      </ItemCardGrid>
    </Content>
  </Page>
);
