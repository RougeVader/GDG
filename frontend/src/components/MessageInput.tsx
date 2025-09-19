import React, { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onStopGenerating: () => void;
  isGenerating: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onStopGenerating, isGenerating }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <InputGroup className="mb-3">
        <Form.Control
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isGenerating}
          className="rounded-pill pe-5"
          style={{ paddingLeft: '1.25rem' }}
        />
        <Button variant="primary" type="submit" disabled={isGenerating} className="rounded-pill ms-2">
          Send
        </Button>
        {isGenerating && (
          <Button variant="danger" onClick={onStopGenerating} className="rounded-pill ms-2">
            Stop
          </Button>
        )}
      </InputGroup>
    </Form>
  );
};

export default MessageInput;