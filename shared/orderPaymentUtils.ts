import type { Order } from "@shared/schema";

export interface OrderWithPaymentStatus extends Order {
  isPaid: boolean;
  canBeFulfilled: boolean;
  paymentStatusDisplay: string;
}

/**
 * Determines if an order is paid based on payment status
 */
export function isOrderPaid(order: Order): boolean {
  return order.paymentStatus === 'completed';
}

/**
 * Determines if an order can be fulfilled (paid and not cancelled)
 */
export function canOrderBeFulfilled(order: Order): boolean {
  return isOrderPaid(order) && order.status !== 'cancelled';
}

/**
 * Enriches order with payment status flags
 */
export function enrichOrderWithPaymentStatus(order: Order): OrderWithPaymentStatus {
  return {
    ...order,
    isPaid: isOrderPaid(order),
    canBeFulfilled: canOrderBeFulfilled(order),
    paymentStatusDisplay: getPaymentStatusDisplay(order.paymentStatus || 'pending'),
  };
}

/**
 * Get human-readable payment status
 */
export function getPaymentStatusDisplay(paymentStatus: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Payment Pending',
    processing: 'Processing Payment',
    completed: 'Paid',
    failed: 'Payment Failed',
    refunded: 'Refunded',
  };
  return statusMap[paymentStatus] || paymentStatus;
}

/**
 * Filter orders by payment status
 */
export function filterOrdersByPaymentStatus(
  orders: Order[],
  filter: 'all' | 'paid' | 'unpaid'
): Order[] {
  if (filter === 'all') return orders;
  if (filter === 'paid') return orders.filter(isOrderPaid);
  if (filter === 'unpaid') return orders.filter(order => !isOrderPaid(order));
  return orders;
}

/**
 * Calculate seller revenue from order (excluding platform commission)
 */
export function calculateSellerRevenue(
  order: Order,
  commissionRate: number = 10 // Default 10% platform commission
): number {
  if (!isOrderPaid(order)) {
    return 0; // No revenue until paid
  }
  
  const total = parseFloat(order.total as any) || 0;
  const commission = total * (commissionRate / 100);
  return total - commission;
}

/**
 * Calculate platform commission from order
 */
export function calculatePlatformCommission(
  order: Order,
  commissionRate: number = 10
): number {
  if (!isOrderPaid(order)) {
    return 0;
  }
  
  const total = parseFloat(order.total as any) || 0;
  return total * (commissionRate / 100);
}

/**
 * Aggregate revenue statistics for seller
 */
export function calculateRevenueStats(orders: Order[], commissionRate: number = 10) {
  const paidOrders = orders.filter(isOrderPaid);
  const unpaidOrders = orders.filter(order => !isOrderPaid(order));
  
  const totalRevenue = paidOrders.reduce((sum, order) => sum + (parseFloat(order.total as any) || 0), 0);
  const pendingRevenue = unpaidOrders.reduce((sum, order) => sum + (parseFloat(order.total as any) || 0), 0);
  
  const platformCommission = paidOrders.reduce(
    (sum, order) => sum + calculatePlatformCommission(order, commissionRate),
    0
  );
  
  const sellerRevenue = paidOrders.reduce(
    (sum, order) => sum + calculateSellerRevenue(order, commissionRate),
    0
  );
  
  return {
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    unpaidOrders: unpaidOrders.length,
    totalRevenue,
    sellerRevenue,
    platformCommission,
    pendingRevenue,
    averageOrderValue: paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0,
  };
}

/**
 * Get payment status badge variant for UI consistency
 */
export function getPaymentStatusBadgeVariant(paymentStatus: string): 
  'default' | 'secondary' | 'destructive' | 'outline' {
  switch (paymentStatus) {
    case 'completed':
      return 'default';
    case 'processing':
      return 'secondary';
    case 'failed':
      return 'destructive';
    case 'pending':
    case 'refunded':
    default:
      return 'outline';
  }
}

/**
 * Get order status badge variant for UI consistency
 */
export function getOrderStatusBadgeVariant(status: string): 
  'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'delivered':
      return 'default';
    case 'delivering':
    case 'processing':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'pending':
    default:
      return 'outline';
  }
}

/**
 * Check if order payment is overdue (pending for more than X hours)
 */
export function isPaymentOverdue(order: Order, hoursThreshold: number = 24): boolean {
  if (isOrderPaid(order)) return false;
  
  const createdAt = new Date(order.createdAt!).getTime();
  const now = Date.now();
  const hoursPassed = (now - createdAt) / (1000 * 60 * 60);
  
  return hoursPassed > hoursThreshold;
}

/**
 * Get payment deadline warning message
 */
export function getPaymentDeadlineMessage(order: Order, hoursThreshold: number = 24): string | null {
  if (isOrderPaid(order)) return null;
  
  const createdAt = new Date(order.createdAt!).getTime();
  const now = Date.now();
  const hoursLeft = hoursThreshold - ((now - createdAt) / (1000 * 60 * 60));
  
  if (hoursLeft <= 0) {
    return 'Payment overdue';
  }
  
  if (hoursLeft < 1) {
    return `Payment due in ${Math.floor(hoursLeft * 60)} minutes`;
  }
  
  if (hoursLeft < 24) {
    return `Payment due in ${Math.floor(hoursLeft)} hours`;
  }
  
  return null;
}
