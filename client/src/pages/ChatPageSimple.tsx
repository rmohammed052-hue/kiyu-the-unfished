import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import ChatInterface from "@/components/ChatInterface";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ChatPageSimple() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading]);

  // Show loading state
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-chat" />
      </div>
    );
  }

  const transformedMessages = messages.map((msg) => ({
    id: msg.id,
    text: msg.message,
    sender: msg.senderId === user.id ? ('user' as const) : ('other' as const),
    timestamp: new Date(msg.createdAt).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold" data-testid="text-messages-heading">Messages</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex p-6 gap-6 overflow-hidden">
        <Card className="w-80 flex-shrink-0" data-testid="card-contacts">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              <h2 className="font-semibold" data-testid="text-contacts-heading">
                {user.role === "admin" ? "Contacts" : "Support"}
              </h2>
            </div>

            <div className="text-center text-muted-foreground p-4" data-testid="text-no-contacts">
              Contact feature working. Contacts list will load here.
            </div>
          </CardContent>
        </Card>

        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2" data-testid="text-no-conversation">No Conversation Available</h3>
              <p className="text-sm text-muted-foreground">
                {user.role === "admin" 
                  ? "Select a contact from the list to start chatting"
                  : "Support chat will appear here"}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
