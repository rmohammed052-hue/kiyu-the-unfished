import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Eye, Package, ShoppingBag, Store } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OrderStatusBadge, { PaymentStatusBadge } from "@/components/OrderStatusBadge";
import { filterOrdersByPaymentStatus } from "@shared/orderPaymentUtils";

interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

type OrderContext = "seller" | "buyer";

export default function SellerOrders() {
  const { user } = useAuth();
  const { formatPrice, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [orderContext, setOrderContext] = useState<OrderContext>("seller");
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: [`/api/orders?context=${orderContext}`],
  });

  // Apply payment filter first, then search filter
  const paymentFilteredOrders = filterOrdersByPaymentStatus(orders as any, paymentFilter);
  
  const filteredOrders = paymentFilteredOrders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "processing": return "bg-blue-500";
      case "shipped": return "bg-purple-500";
      case "delivered": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <DashboardLayout role="seller">
      <div className="p-6">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Orders</h1>
            <p className="text-muted-foreground">
              {orderContext === "seller" 
                ? "Manage orders from your customers" 
                : "View your personal shopping orders"}
            </p>
          </div>
          
          <Tabs value={orderContext} onValueChange={(value) => setOrderContext(value as OrderContext)}>
            <TabsList data-testid="tabs-order-context">
              <TabsTrigger value="seller" data-testid="tab-business-orders">
                <Store className="h-4 w-4 mr-2" />
                Business Orders
              </TabsTrigger>
              <TabsTrigger value="buyer" data-testid="tab-personal-orders">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Personal Orders
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders by number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          
          <Tabs value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as any)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({orders.filter(o => o.paymentStatus === 'completed').length})</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid ({orders.filter(o => o.paymentStatus !== 'completed').length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              {orderContext === "seller" ? (
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              ) : (
                <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              )}
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "No orders match your search" 
                  : orderContext === "seller"
                    ? "You haven't received any customer orders yet"
                    : "You haven't placed any orders as a customer yet"}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="p-4" data-testid={`card-order-${order.id}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-lg">#{order.orderNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <OrderStatusBadge 
                        status={order.status} 
                        paymentStatus={order.paymentStatus || "pending"}
                        showPaymentStatus={true}
                      />
                    </div>
                    <p className="text-lg font-bold mt-2">{formatPrice(Number(order.total) || 0)}</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid={`button-view-${order.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
