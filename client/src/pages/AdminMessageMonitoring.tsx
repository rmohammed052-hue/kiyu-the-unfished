import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Search, Eye, AlertCircle, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useSocket } from "@/contexts/NotificationContext";
import { formatDistanceToNow } from "date-fns";

interface MessageStats {
  totalMessages: number;
  deliveredMessages: number;
  readMessages: number;
  pendingMessages: number;
  activeConversations: number;
  avgResponseTime: number;
}

interface Conversation {
  userId: number;
  userName: string;
  userRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  totalMessages: number;
  messageStatus: 'sent' | 'delivered' | 'read';
  conversationId: string;
}

interface RecentMessage {
  id: number;
  senderName: string;
  senderRole: string;
  receiverName: string;
  receiverRole: string;
  message: string;
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  deliveredAt?: string | null;
  readAt?: string | null;
}

export default function AdminMessageMonitoring() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const socket = useSocket();

  // Fetch message statistics
  const { data: stats, refetch: refetchStats } = useQuery<MessageStats>({
    queryKey: ["/api/admin/message-stats"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch active conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/admin/conversations"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch recent messages
  const { data: recentMessages = [] } = useQuery<RecentMessage[]>({
    queryKey: ["/api/admin/recent-messages"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Real-time updates via socket
  useEffect(() => {
    if (!socket) return;

    const handleMessageUpdate = () => {
      refetchStats();
    };

    socket.on("admin_message_sent", handleMessageUpdate);
    socket.on("admin_message_delivered", handleMessageUpdate);
    socket.on("admin_message_read", handleMessageUpdate);

    return () => {
      socket.off("admin_message_sent", handleMessageUpdate);
      socket.off("admin_message_delivered", handleMessageUpdate);
      socket.off("admin_message_read", handleMessageUpdate);
    };
  }, [socket, refetchStats]);

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.userRole.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDeliveryRate = () => {
    if (!stats || stats.totalMessages === 0) return 0;
    return Math.round((stats.deliveredMessages / stats.totalMessages) * 100);
  };

  const getReadRate = () => {
    if (!stats || stats.totalMessages === 0) return 0;
    return Math.round((stats.readMessages / stats.totalMessages) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read': return 'bg-green-500';
      case 'delivered': return 'bg-blue-500';
      case 'sent': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Message Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time message tracking and delivery status
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.activeConversations || 0} active conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getDeliveryRate()}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.deliveredMessages || 0} delivered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Read Rate</CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getReadRate()}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.readMessages || 0} read
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.avgResponseTime ? `${Math.round(stats.avgResponseTime / 60)}m` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average response</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="recent">Recent Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Delivery Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Status Breakdown</CardTitle>
                  <CardDescription>Message delivery statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Read Messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stats?.readMessages || 0}</span>
                      <Badge className="bg-green-500">
                        {getReadRate()}%
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Delivered Messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stats?.deliveredMessages || 0}</span>
                      <Badge className="bg-blue-500">
                        {getDeliveryRate()}%
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Pending Messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{stats?.pendingMessages || 0}</span>
                      <Badge className="bg-yellow-500">Pending</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Active Conversations</CardTitle>
                  <CardDescription>
                    Users with recent message activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-primary mb-2" />
                    <p className="text-3xl font-bold mb-1">
                      {stats?.activeConversations || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Active conversations right now
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>Active Conversations</CardTitle>
                <CardDescription>Monitor user messaging activity</CardDescription>
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by username or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {filteredConversations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No conversations found</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv) => (
                        <Card key={conv.conversationId} className="p-4 hover:bg-accent transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{conv.userName}</span>
                                <Badge variant="outline" className="text-xs">
                                  {conv.userRole}
                                </Badge>
                                <Badge className={getStatusColor(conv.messageStatus)}>
                                  {conv.messageStatus}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {conv.lastMessage}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conv.lastMessageTime), {
                                    addSuffix: true,
                                  })}
                                </span>
                                <span className="text-xs">
                                  {conv.totalMessages} messages
                                </span>
                                {conv.unreadCount > 0 && (
                                  <Badge variant="destructive" className="text-xs">
                                    {conv.unreadCount} unread
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent">
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Latest message activity across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {recentMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No recent messages</p>
                      </div>
                    ) : (
                      recentMessages.map((msg) => (
                        <Card key={msg.id} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">{msg.senderName}</span>
                                <span className="text-xs text-muted-foreground">→</span>
                                <span className="text-sm font-semibold">{msg.receiverName}</span>
                              </div>
                              <Badge className={getStatusColor(msg.status)}>
                                {msg.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {msg.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Sent: {formatDistanceToNow(new Date(msg.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                              {msg.deliveredAt && (
                                <span>
                                  Delivered: {formatDistanceToNow(new Date(msg.deliveredAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              )}
                              {msg.readAt && (
                                <span>
                                  Read: {formatDistanceToNow(new Date(msg.readAt), {
                                    addSuffix: true,
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
