import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, Package, ShoppingCart, Percent, AlertCircle } from "lucide-react";
import { calculateRevenueStats } from "@shared/orderPaymentUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AnalyticsStats {
  totalRevenue: number;
  totalOrders: number;
  productsSold: number;
  growthRate: number;
}

interface Order {
  id: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function SellerAnalytics() {
  const { user } = useAuth();
  const { formatPrice } = useLanguage();

  const { data: stats, isLoading } = useQuery<AnalyticsStats>({
    queryKey: ["/api/analytics"],
    enabled: !!user && user.role === "seller",
  });

  // Fetch seller orders for revenue breakdown
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders?context=seller"],
    enabled: !!user && user.role === "seller",
  });

  // Calculate revenue statistics with commission
  const revenueStats = useMemo(() => {
    if (!orders.length) return null;
    return calculateRevenueStats(orders as any, 10); // 10% platform commission
  }, [orders]);

  const metrics = [
    {
      title: "Total Revenue (Gross)",
      description: "Before platform commission",
      value: revenueStats?.totalRevenue || 0,
      icon: DollarSign,
      format: true,
      color: "text-blue-600",
    },
    {
      title: "Your Earnings (Net)",
      description: "After 10% commission",
      value: revenueStats?.sellerRevenue || 0,
      icon: TrendingUp,
      format: true,
      color: "text-green-600",
    },
    {
      title: "Platform Commission",
      description: "10% of paid orders",
      value: revenueStats?.platformCommission || 0,
      icon: Percent,
      format: true,
      color: "text-amber-600",
    },
    {
      title: "Pending Revenue",
      description: "Unpaid orders",
      value: revenueStats?.pendingRevenue || 0,
      icon: AlertCircle,
      format: true,
      color: "text-orange-600",
    },
    {
      title: "Paid Orders",
      value: revenueStats?.paidOrders || 0,
      icon: ShoppingCart,
      description: `of ${revenueStats?.totalOrders || 0} total`,
    },
    {
      title: "Products Sold",
      value: stats?.productsSold || 0,
      icon: Package,
      description: "Total items",
    },
    {
      title: "Average Order Value",
      description: "Per paid order",
      value: revenueStats?.averageOrderValue || 0,
      icon: DollarSign,
      format: true,
    },
    {
      title: "Growth Rate",
      value: `${stats?.growthRate || 0}%`,
      icon: TrendingUp,
      description: "Month over month",
    },
  ];

  return (
    <DashboardLayout role="seller">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Analytics</h1>
          <p className="text-muted-foreground">Track your store performance and revenue</p>
        </div>

        {/* Revenue Breakdown Alert */}
        {revenueStats && revenueStats.unpaidOrders > 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Pending Payments</AlertTitle>
            <AlertDescription>
              You have {revenueStats.unpaidOrders} order(s) with pending payments totaling {formatPrice(revenueStats.pendingRevenue)}. 
              Revenue will be added to your earnings once payments are completed.
            </AlertDescription>
          </Alert>
        )}

        {isLoading || ordersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metrics.map((metric, index) => (
                <Card key={index} data-testid={`card-metric-${index}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      {metric.description && (
                        <CardDescription className="text-xs mt-1">{metric.description}</CardDescription>
                      )}
                    </div>
                    <metric.icon className={`h-4 w-4 ${metric.color || 'text-muted-foreground'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${metric.color || ''}`}>
                      {metric.format ? formatPrice(Number(metric.value) || 0) : metric.value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Breakdown Card */}
            {revenueStats && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Understanding your earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div>
                        <p className="font-medium">Gross Revenue (from paid orders)</p>
                        <p className="text-sm text-muted-foreground">{revenueStats.paidOrders} paid orders</p>
                      </div>
                      <p className="text-xl font-bold text-blue-600">{formatPrice(revenueStats.totalRevenue)}</p>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                      <div>
                        <p className="font-medium">Platform Commission (10%)</p>
                        <p className="text-sm text-muted-foreground">Service fee</p>
                      </div>
                      <p className="text-xl font-bold text-amber-600">- {formatPrice(revenueStats.platformCommission)}</p>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div>
                        <p className="font-medium">Your Net Earnings</p>
                        <p className="text-sm text-muted-foreground">Available for payout</p>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{formatPrice(revenueStats.sellerRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
          <p className="text-muted-foreground">Detailed analytics charts coming soon...</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
