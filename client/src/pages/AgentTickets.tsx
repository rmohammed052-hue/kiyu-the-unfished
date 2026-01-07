import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import ThemeToggle from "@/components/ThemeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Ticket, Clock, CheckCircle, XCircle, ChevronLeft } from "lucide-react";

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

export default function AgentTickets() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "agent")) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support-tickets"],
    enabled: isAuthenticated && user?.role === "agent",
  });

  if (authLoading || !isAuthenticated || user?.role !== "agent") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-agent-tickets" />
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === "open");
  const inProgressTickets = tickets.filter(t => t.status === "in_progress");
  const resolvedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed");

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "open": return <Ticket className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "resolved": return <CheckCircle className="h-4 w-4" />;
      case "closed": return <XCircle className="h-4 w-4" />;
      default: return <Ticket className="h-4 w-4" />;
    }
  };

  const TicketCard = ({ ticket }: { ticket: SupportTicket }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow" 
      data-testid={`ticket-${ticket.id}`}
      onClick={() => navigate(`/agent/tickets/${ticket.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-2">{ticket.subject}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">{ticket.description}</p>
          </div>
          <Badge variant={getPriorityColor(ticket.priority)} className="ml-2">
            {ticket.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            {getStatusIcon(ticket.status)}
            <span className="capitalize">{ticket.status.replace("_", " ")}</span>
          </div>
          <span className="text-muted-foreground">
            {new Date(ticket.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout role="agent" showBackButton>
      <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card data-testid="card-open-count">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Open</CardTitle>
                  <Ticket className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{openTickets.length}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-in-progress-count">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inProgressTickets.length}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-resolved-count">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resolvedTickets.length}</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="open" className="space-y-4">
              <TabsList>
                <TabsTrigger value="open" data-testid="tab-open">
                  Open ({openTickets.length})
                </TabsTrigger>
                <TabsTrigger value="in-progress" data-testid="tab-in-progress">
                  In Progress ({inProgressTickets.length})
                </TabsTrigger>
                <TabsTrigger value="resolved" data-testid="tab-resolved">
                  Resolved ({resolvedTickets.length})
                </TabsTrigger>
                <TabsTrigger value="all" data-testid="tab-all">
                  All ({tickets.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : openTickets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No open tickets</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {openTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="in-progress" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : inProgressTickets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tickets in progress</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {inProgressTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resolved" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : resolvedTickets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No resolved tickets</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {resolvedTickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : tickets.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tickets available</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {tickets.map(ticket => (
                      <TicketCard key={ticket.id} ticket={ticket} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
    </DashboardLayout>
  );
}
