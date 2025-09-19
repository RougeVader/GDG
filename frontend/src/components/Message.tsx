import React from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

interface MessageProps {
  text: string;
  isUser: boolean;
  isStreaming?: boolean;
}

const Message: React.FC<MessageProps> = ({ text, isUser, isStreaming }) => {
  const cleanText = DOMPurify.sanitize(text);

  return (
    <div className={`d-flex ${isUser ? 'justify-content-end' : 'justify-content-start'} mb-3`}>
      <div
        className={`message-bubble ${isUser ? 'user-message' : 'ai-message'}`}
      >
        <div className="card-body p-2">
          <ReactMarkdown components={{
            code: (props: any) => {
              const { inline, className, children } = props;
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <pre className="p-2 rounded">
                  <code className={className}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className={className}>
                  {children}
                </code>
              );
            }
          }}>
            {cleanText}
          </ReactMarkdown>
          {isStreaming && !isUser && (
            <span className="spinner-grow spinner-grow-sm ms-2" role="status" aria-hidden="true"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;