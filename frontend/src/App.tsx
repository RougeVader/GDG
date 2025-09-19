import React from 'react';
import './App.css';
import ChatWindow from './components/ChatWindow';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>Ollama Chatbot</p>
      </header>
      <main className="chat-container">
        <ChatWindow />
      </main>
    </div>
  );
}

export default App;