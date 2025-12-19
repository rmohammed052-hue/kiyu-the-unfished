import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, MapPin, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Delivery {
  id: string;
  orderNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
}

export default function RiderDeliveries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: deliveries = [], isLoading } = useQuery<Delivery[]>({
    queryKey: ["/api/deliveries", "rider"],
    queryFn: async () => {
      const res = await fetch("/api/deliveries?role=rider");
      if (!res.ok) throw new Error("Failed to fetch deliveries");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/deliveries/${id}/status`, { status });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Delivery status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries", "rider"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredDeliveries = statusFilter === "all" 
    ? deliveries 
    : deliveries.filter(d => d.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "assigned": return "bg-blue-500";
      case "picked_up": return "bg-purple-500";
      case "in_transit": return "bg-orange-500";
      case "delivered": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <DashboardLayout role="rider">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Deliveries</h1>
            <p className="text-muted-foreground">Manage your delivery assignments</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Deliveries</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No deliveries</h3>
              <p className="text-muted-foreground">
                {statusFilter === "all" ? "You have no assigned deliveries" : `No ${statusFilter} deliveries`}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => (
              <Card key={delivery.id} className="p-4" data-testid={`card-delivery-${delivery.id}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">Order #{delivery.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">{delivery.customerName}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(delivery.status)} text-white`}>
                      {delivery.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-green-500" />
                      <div>
                        <p className="font-medium">Pickup</p>
                        <p className="text-muted-foreground">{delivery.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-red-500" />
                      <div>
                        <p className="font-medium">Delivery</p>
                        <p className="text-muted-foreground">{delivery.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {delivery.status === "assigned" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: "picked_up" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-pickup-${delivery.id}`}
                      >
                        Mark as Picked Up
                      </Button>
                    )}
                    {delivery.status === "picked_up" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: "in_transit" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-intransit-${delivery.id}`}
                      >
                        Mark as In Transit
                      </Button>
                    )}
                    {delivery.status === "in_transit" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: "delivered" })}
                        disabled={updateStatusMutation.isPending}
                        data-testid={`button-deliver-${delivery.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
