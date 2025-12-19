import MetricCard from '../MetricCard';
import { DollarSign, ShoppingBag, Users, Truck } from 'lucide-react';

export default function MetricCardExample() {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total Revenue"
        value="GHS 45,231"
        icon={DollarSign}
        change={12.5}
      />
      <MetricCard
        title="Total Orders"
        value="1,234"
        icon={ShoppingBag}
        change={8.2}
      />
      <MetricCard
        title="Active Users"
        value="892"
        icon={Users}
        change={-3.1}
      />
      <MetricCard
        title="Deliveries"
        value="456"
        icon={Truck}
        change={15.3}
      />
    </div>
  );
}
