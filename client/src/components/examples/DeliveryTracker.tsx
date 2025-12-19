import DeliveryTracker from '../DeliveryTracker';

export default function DeliveryTrackerExample() {
  const steps = [
    { label: 'Order Placed', time: 'Nov 2, 10:30 AM', completed: true },
    { label: 'Order Confirmed', time: 'Nov 2, 10:35 AM', completed: true },
    { label: 'Out for Delivery', time: 'Nov 2, 2:15 PM', completed: true },
    { label: 'Delivered', completed: false },
  ];

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <DeliveryTracker
        orderId="ORD-001"
        riderName="Kwame Mensah"
        riderPhone="+233 XX XXX XXXX"
        steps={steps}
        estimatedArrival="3:30 PM"
      />
    </div>
  );
}
