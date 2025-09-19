import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import Message from './Message';
import MessageInput from './MessageInput';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  isStreaming?: boolean;
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', text: 'Hello! How can I help you today?', isUser: false },
  ]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const OLLAMA_MODEL = "llava:13b"; // Default model, can be made configurable

  const messageIdCounter = useRef<number>(2);

  const getNextMessageId = () => {
    const nextId = messageIdCounter.current;
    messageIdCounter.current += 1;
    return nextId.toString();
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    setError(null);
    const newUserMessage: ChatMessage = { id: getNextMessageId(), text, isUser: true };
    const newAIMessage: ChatMessage = { id: getNextMessageId(), text: '', isUser: false, isStreaming: true };
    setMessages((prevMessages) => [...prevMessages, newUserMessage, newAIMessage]);
    setIsGenerating(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const context = messages.filter(msg => !msg.isStreaming).map(msg => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: text,
          context: context,
        }),
        signal: signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process each complete SSE 'data:' line
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            let jsonString = '';
            try {
              jsonString = line.substring(6);
              const data = JSON.parse(jsonString);

              if (data.error) {
                setError(data.error + (data.details ? `: ${data.details}` : ''));
                setIsGenerating(false);
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.id === newAIMessage.id ? { ...msg, isStreaming: false } : msg
                  )
                );
                abortControllerRef.current?.abort();
                return;
              }

              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                if (lastMessage.id === newAIMessage.id) {
                  return prevMessages.map((msg) =>
                    msg.id === newAIMessage.id
                      ? { ...msg, text: msg.text + (data.response || ''), isStreaming: !data.done }
                      : msg
                  );
                } else {
                  // This case should ideally not happen if messages are managed correctly
                  return [...prevMessages, { ...newAIMessage, text: data.response || '', isStreaming: !data.done }];
                }
              });

              if (data.done) {
                setIsGenerating(false);
                abortControllerRef.current?.abort();
                return;
              }
            } catch (jsonError) {
              console.error('Failed to parse JSON from stream:', jsonString, jsonError);
              // Continue processing, might be an incomplete JSON object
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Message generation aborted.');
      } else {
        console.error('Failed to send message or receive stream:', err);
        setError(err.message || 'Failed to send message. Please try again.');
      }
      setIsGenerating(false);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === newAIMessage.id ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.isStreaming ? { ...msg, isStreaming: false } : msg
      )
    );
  };

  return (
    <Container className="d-flex flex-column vh-100 chat-container">
      <Row className="flex-grow-1 overflow-auto chat-messages" ref={chatWindowRef}>
        <Col>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
          {messages.map((msg) => (
            <Message key={msg.id} text={msg.text} isUser={msg.isUser} isStreaming={msg.isStreaming} />
          ))}
        </Col>
      </Row>
      <Row className="mb-3 message-input-area">
        <Col>
          <MessageInput
            onSendMessage={handleSendMessage}
            onStopGenerating={handleStopGenerating}
            isGenerating={isGenerating}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default ChatWindow;
