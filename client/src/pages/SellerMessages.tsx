import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { useLocation } from "wouter";

export default function SellerMessages() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <DashboardLayout role="seller">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Messages</h1>
          <p className="text-muted-foreground">Chat with customers and support</p>
        </div>

        <Card className="p-12">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Message Center</h3>
            <p className="text-muted-foreground mb-4">Communicate with your customers</p>
            <Button onClick={() => navigate("/chat")} data-testid="button-open-chat">
              Open Chat
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
