import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Package, Truck, CheckCircle2, XCircle, AlertTriangle, CircleDollarSign, AlertCircle } from "lucide-react";

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
  paymentStatus?: string;
  showPaymentStatus?: boolean;
}

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  },
  processing: {
    label: "Processing",
    icon: Package,
    variant: "secondary" as const,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  delivering: {
    label: "Delivering",
    icon: Truck,
    variant: "secondary" as const,
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    variant: "secondary" as const,
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    variant: "destructive" as const,
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  disputed: {
    label: "Disputed",
    icon: AlertTriangle,
    variant: "secondary" as const,
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
};

const paymentStatusConfig = {
  completed: {
    label: "Paid",
    icon: CircleDollarSign,
    variant: "default" as const,
    className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  pending: {
    label: "Unpaid",
    icon: AlertCircle,
    variant: "outline" as const,
    className: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    variant: "secondary" as const,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    variant: "destructive" as const,
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  refunded: {
    label: "Refunded",
    icon: AlertTriangle,
    variant: "outline" as const,
    className: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  },
};

export default function OrderStatusBadge({ 
  status, 
  className,
  paymentStatus,
  showPaymentStatus = false 
}: OrderStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  if (!showPaymentStatus || !paymentStatus) {
    return (
      <Badge
        variant={config.variant}
        className={cn("gap-1.5 px-3 py-1", config.className, className)}
        data-testid={`badge-${status}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
      </Badge>
    );
  }

  const paymentConfig = paymentStatusConfig[paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.pending;
  const PaymentIcon = paymentConfig.icon;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge
        variant={config.variant}
        className={cn("gap-1.5 px-3 py-1", config.className, className)}
        data-testid={`badge-${status}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
      </Badge>
      <Badge
        variant={paymentConfig.variant}
        className={cn("gap-1.5 px-3 py-1", paymentConfig.className)}
        data-testid={`badge-payment-${paymentStatus}`}
      >
        <PaymentIcon className="h-3.5 w-3.5" />
        <span>{paymentConfig.label}</span>
      </Badge>
    </div>
  );
}

// Standalone payment status badge component
interface PaymentStatusBadgeProps {
  paymentStatus: string;
  className?: string;
}

export function PaymentStatusBadge({ paymentStatus, className }: PaymentStatusBadgeProps) {
  const config = paymentStatusConfig[paymentStatus as keyof typeof paymentStatusConfig] || paymentStatusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn("gap-1.5 px-3 py-1", config.className, className)}
      data-testid={`badge-payment-${paymentStatus}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </Badge>
  );
}
