import React, { useState } from 'react';
import {
  Container,
  TextField,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import {
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import SendIcon from '@mui/icons-material/Send';

interface ChatMessage {
  sender: 'user' | 'adpBot';
  text: string;
}

const ChatUI = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const handleSend = async () => {
    if (userInput.trim()) {
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: 'user', text: userInput },
      ]);
      const response = await fetch('http://localhost:5139/api/chat/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }),
      });
      const data = await response.json();
      setResponse(data.response);
      setChatHistory(prevHistory => [
        ...prevHistory,
        { sender: 'adpBot', text: data.response },
      ]);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ADP Chatbot
        </Typography>
        <Paper sx={{ p: 2, mb: 2, maxHeight: '400px', overflow: 'auto' }}>
          <List>
            {chatHistory.map((message, index) => (
              <ListItem key={index} alignItems="flex-start">
                <ListItemText
                  primary={message.text}
                  secondary={message.sender === 'user' ? 'You' : 'ADP'}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Ask a question to ADP Bot."
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="search"
                    size="small"
                    onClick={handleSend}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
    </Container>
  );
};

export default ChatUI;
