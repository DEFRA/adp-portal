import React from 'react';
import { Typography } from '@material-ui/core';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  SupportButton,
} from '@backstage/core-components';
import ChatUI from './ChatUI';

export const Chatbot = () => {
return (
  
  <Page themeId="tool">
    <Header
      title="Azure Development Platform: Chat"
      subtitle="ADP Chatbot"
    />
    <Content>
      <ContentHeader title="ADP Chat">
        <SupportButton>
          Get support through the ADP AI Chatbot.
        </SupportButton>
      </ContentHeader>
      <Typography paragraph>
        Get support through the ADP AI Chatbot.
      </Typography> 
      <ChatUI />
    </Content>
  </Page>
)
}
