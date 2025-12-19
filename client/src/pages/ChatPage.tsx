import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ChatPage() {
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
    },
    {
      id: '4',
      text: 'Let me check that for you. Your order is currently out for delivery and should arrive by 3:30 PM today.',
      sender: 'user' as const,
      timestamp: '10:33 AM'
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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <ChatInterface
            contactName="Sarah Johnson"
            contactStatus="online"
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>
      </main>
    </div>
  );
}
