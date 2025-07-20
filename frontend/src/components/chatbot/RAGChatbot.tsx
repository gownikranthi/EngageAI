import React, { useState } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import api from '../../services/api'; // Your configured Axios instance
import './RAGChatbot.css';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export const RAGChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi! I'm the EngageAI Helper. Ask me anything about the events.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const askBot = async (question: string) => {
    const response = await api.post('/rag-chat', { question });
    return response.data;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askBot(input);
      const botMessage: Message = { text: response.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = { text: 'Sorry, I had trouble connecting. Please try again.', sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="rag-chatbot-fab">
        <MessageSquare size={28} />
      </button>
    );
  }

  return (
    <div className="rag-chatbot-window">
      <div className="rag-chatbot-header">
        <h3>EngageAI Helper</h3>
        <button onClick={() => setIsOpen(false)}><X size={20} /></button>
      </div>
      <div className="rag-chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`rag-message ${msg.sender}`}>
            {msg.sender === 'bot' && <Bot className="rag-avatar" />}
            <p>{msg.text}</p>
          </div>
        ))}
        {isLoading && (
           <div className="rag-message bot">
              <Bot className="rag-avatar" />
              <p className="rag-typing-indicator"><span>.</span><span>.</span><span>.</span></p>
           </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="rag-chatbot-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about events..."
          disabled={isLoading}
          autoFocus
        />
        <button type="submit" disabled={isLoading}><Send size={20} /></button>
      </form>
    </div>
  );
}; 