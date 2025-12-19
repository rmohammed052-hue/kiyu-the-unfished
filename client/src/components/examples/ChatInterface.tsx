import ChatInterface from '../ChatInterface';
import { useState } from 'react';

export default function ChatInterfaceExample() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: 'Hello! I have a question about my order.',
      sender: 'other' as const,
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      text: 'Hi! I\'d be happy to help. What\'s your order number?',
      sender: 'user' as const,
      timestamp: '10:31 AM'
    },
    {
      id: '3',
      text: 'It\'s ORD-001. When will it be delivered?',
      sender: 'other' as const,
      timestamp: '10:32 AM'
    }
  ]);

  const handleSendMessage = (message: string) => {
    setMessages([...messages, {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <ChatInterface
        contactName="Sarah Johnson"
        contactStatus="online"
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
