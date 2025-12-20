import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { io } from "socket.io-client";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, UserCheck, Package, Truck, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  riderId: string | null;
  deliveryMethod: string;
  total: string;
  status: string;
  createdAt: string;
  shippingAddress?: string;
}

interface AvailableRider {
  rider: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profileImage: string | null;
    isActive: boolean;
  };
  activeOrderCount: number;
}

function AssignRiderDialog({ order, onSuccess }: { order: Order; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const { data: availableRiders = [], isLoading: loadingRiders } = useQuery<AvailableRider[]>({
    queryKey: ["/api/riders/available"],
    enabled: open,
  });

  const assignMutation = useMutation({
    mutationFn: async (riderId: string) => {
      return apiRequest("PATCH", `/api/orders/${order.id}/assign-rider`, {
        riderId,
      });
    },
    onSuccess: () => {
      toast({
        title: "Rider Assigned",
        description: `Rider successfully assigned to order ${order.orderNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setOpen(false);
      setShowConfirm(false);
      setSelectedRiderId(null);
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Assignment Failed",
        description: error.message || "Failed to assign rider",
      });
      setShowConfirm(false);
    },
  });

  const selectedRider = availableRiders.find(r => r.rider.id === selectedRiderId);

  const handleAssign = () => {
    if (selectedRiderId) {
      assignMutation.mutate(selectedRiderId);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" data-testid={`button-assign-rider-${order.id}`}>
            <UserCheck className="h-4 w-4 mr-2" />
            Assign Rider
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid={`dialog-assign-rider-${order.id}`}>
          <DialogHeader>
            <DialogTitle>Assign Rider to Order</DialogTitle>
            <DialogDescription>
              Select a rider to deliver order {order.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Method:</span>
                  <Badge variant="secondary">{order.deliveryMethod}</Badge>
                </div>
                {order.shippingAddress && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-right max-w-xs">{order.shippingAddress}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Available Riders</h3>
              
              {loadingRiders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : availableRiders.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No available riders</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableRiders.map((riderData) => (
                    <Card
                      key={riderData.rider.id}
                      className={`cursor-pointer transition-colors ${
                        selectedRiderId === riderData.rider.id
                          ? "border-primary bg-primary/5"
                          : "hover-elevate"
                      }`}
                      onClick={() => setSelectedRiderId(riderData.rider.id)}
                      data-testid={`card-rider-${riderData.rider.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={riderData.rider.profileImage || undefined} />
                            <AvatarFallback>{riderData.rider.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{riderData.rider.name}</h4>
                            <p className="text-sm text-muted-foreground">{riderData.rider.email}</p>
                            {riderData.rider.phone && (
                              <p className="text-xs text-muted-foreground">{riderData.rider.phone}</p>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {riderData.activeOrderCount}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Active {riderData.activeOrderCount === 1 ? "Order" : "Orders"}
                            </div>
                          </div>
                          {selectedRiderId === riderData.rider.id && (
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                data-testid="button-cancel-assign"
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedRiderId || assignMutation.isPending}
                onClick={() => setShowConfirm(true)}
                data-testid="button-confirm-assign"
              >
                {assignMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign Selected Rider
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent data-testid="alert-confirm-assignment">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Rider Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign <strong>{selectedRider?.rider.name}</strong> to deliver order <strong>{order.orderNumber}</strong>?
              {selectedRider && selectedRider.activeOrderCount > 0 && (
                <div className="mt-2 text-amber-600 dark:text-amber-400">
                  Note: This rider currently has {selectedRider.activeOrderCount} active {selectedRider.activeOrderCount === 1 ? "order" : "orders"}.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssign}
              disabled={assignMutation.isPending}
              data-testid="button-confirm-final"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Confirm Assignment"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function AdminManualRiderAssignment() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { formatPrice } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin"))) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // FIX #5: Listen for rider assignment confirmations via socket
  useEffect(() => {
    if (!user) return;

    const socket = io({
      auth: { userId: user.id }
    });

    socket.on('connect', () => {
      console.log('🔌 Admin assignment socket connected');
      socket.emit('register', user.id);
    });

    socket.on('rider_assignment_confirmed', (data: {
      orderId: string;
      orderNumber: string;
      riderName: string;
      riderId: string;
      assignedAt: string;
    }) => {
      console.log('✅ Rider assignment confirmed:', data);
      
      toast({
        title: "Rider Assigned Successfully",
        description: `${data.riderName} has been assigned to Order #${data.orderNumber}`,
      });

      // Refresh orders list
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    });

    socket.on('disconnect', () => {
      console.log('🔌 Admin assignment socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [user, toast]);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin"),
  });

  // Filter orders that need rider assignment (no riderId and delivery method requires shipping)
  const unassignedOrders = orders.filter(
    (order) => 
      !order.riderId && 
      order.deliveryMethod !== "pickup" &&
      (order.status === "pending" || order.status === "paid" || order.status === "processing")
  );

  if (authLoading || !isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout role={user?.role as any} showBackButton>
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-manual-rider-assignment">
              Manual Rider Assignment
            </h1>
            <p className="text-muted-foreground mt-1">
              Assign riders to orders requiring delivery
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : unassignedOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Orders Pending Assignment</h3>
                <p className="text-muted-foreground">
                  All eligible orders have been assigned to riders or don't require delivery.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {unassignedOrders.length} {unassignedOrders.length === 1 ? "order" : "orders"} pending rider assignment
              </span>
            </div>

            <div className="grid gap-4">
              {unassignedOrders.map((order) => (
                <Card key={order.id} data-testid={`card-order-${order.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg" data-testid={`text-order-number-${order.id}`}>
                            {order.orderNumber}
                          </h3>
                          <Badge variant="secondary" data-testid={`badge-status-${order.id}`}>
                            {order.status}
                          </Badge>
                          <Badge variant="outline" data-testid={`badge-delivery-${order.id}`}>
                            {order.deliveryMethod}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total:</span>{" "}
                            <span className="font-medium">{formatPrice(parseFloat(order.total))}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Created:</span>{" "}
                            <span className="font-medium">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {order.shippingAddress && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">Address:</span>{" "}
                              <span className="font-medium">{order.shippingAddress}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-center px-4 py-2 bg-muted rounded-lg">
                          <AlertCircle className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                          <span className="text-xs font-medium text-muted-foreground">No Rider</span>
                        </div>
                        <AssignRiderDialog
                          order={order}
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
