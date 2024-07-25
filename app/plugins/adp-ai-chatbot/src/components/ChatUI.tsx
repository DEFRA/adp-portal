import React, { useEffect, useState } from 'react';
import {
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Container,
  TextField,
  Box,
  Typography,
  Paper,
} from '@mui/material/';
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, Grid } from '@material-ui/core';
import DeleteIcon from '@mui/icons-material/Delete';
import { useApi, identityApiRef } from '@backstage/core-plugin-api';

interface ChatMessage {
  sender: 'user' | 'adpBot';
  text: string;
  timestamp: string;
}

const ChatUI = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  // if chat history is empty, automatically call handleGetHistory and populate it and carry on using the same conversationId
  // if chathistory empy
  // const data = handlegethistory()
  // setchathistory(data)

  const [responseFetched, setResponseFetched] = useState<boolean>(true);
  const [conversationId, setConversationId] = useState<string>(
    crypto.randomUUID(),
  );

  const identityApi = useApi(identityApiRef);

  const handleSend = async () => {
    const userId = await identityApi.getBackstageIdentity();
    if (userInput.trim()) {
      const currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: 'user', text: userInput, timestamp: currentTime },
      ]);
      setUserInput('');
      setResponseFetched(false);
      const response = await fetch('http://localhost:5139/api/chat/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: conversationId,
          user: userId.userEntityRef,
          prompt: userInput,
        }),
      });
      const data = await response.json();
      setChatHistory(prevHistory => [
        ...prevHistory,
        {
          sender: 'adpBot',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
      setResponseFetched(true);
    }
  };

  const handleGetHistory = async () => {
    const userId = await identityApi.getBackstageIdentity();
    const response = await fetch('http://localhost:5139/api/chat/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: userId.userEntityRef,
      }),
    });
    const data = await response.json();
    const messages = data.messages.map(
      (message: { user: string; message: string; timestamp: string }) => ({
        sender: message.user === userId.userEntityRef ? 'user' : 'adpBot',
        text: message.message,
        timestamp: message.timestamp,
      }),
    );
    setChatHistory(messages);
  };

  const handleNew = async () => {
    setConversationId(crypto.randomUUID());
    setChatHistory([]);
    setResponseFetched(true);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box>
        <Grid container spacing={0}>
          <Grid xs={9}>
            <Typography variant="h4" component="h1" gutterBottom>
              ADP Chatbot
            </Typography>
          </Grid>
          <Grid xs>
            <Button
              variant="outlined"
              startIcon={<DeleteIcon />}
              onClick={handleNew}
            >
              New Conversation
            </Button>
            <Button variant="outlined" onClick={handleGetHistory}>
              Get
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Paper
        sx={{
          p: 2,
          height: '75vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        <List sx={{ width: '100%' }}>
          {chatHistory.map((message, index) => (
            <ListItem
              key={index}
              alignItems="flex-start"
              sx={{
                justifyContent:
                  message.sender === 'user' ? 'flex-end' : 'flex-start',
                textAlign: message.sender === 'user' ? 'right' : 'left',
              }}
            >
              <ListItemText
                primary={
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.text}
                  </ReactMarkdown>
                }
                secondary={`${message.sender === 'user' ? 'You' : 'ADP'} at ${
                  message.timestamp
                }`}
                sx={{
                  maxWidth: '70%',
                  '& .MuiListItemText-primary': {
                    bgcolor: message.sender === 'user' ? '#5694ca' : '#f3f2f1',
                    p: 1,
                  },
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Ask a question to ADP Bot"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={handleKeyPress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {responseFetched ? (
                  <IconButton aria-label="send" onClick={handleSend}>
                    <SendIcon />
                  </IconButton>
                ) : (
                  <CircularProgress size={24} />
                )}
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Container>
  );
};

export default ChatUI;
