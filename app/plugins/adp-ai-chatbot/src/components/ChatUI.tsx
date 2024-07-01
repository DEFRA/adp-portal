import React, { useState } from 'react';
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
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessage {
  sender: 'user' | 'adpBot';
  text: string;
  timestamp: string;
}

const ChatUI = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [responseFetched, setResponseFetched] = useState<boolean>(true);

  const conversationId = "1239";
  const userperson = "example-aimee";



  const handleSend = async () => {
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
          user: userperson,
          prompt: userInput }),
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

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        ADP Chatbot
      </Typography>
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
                primary={<ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown >}
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
