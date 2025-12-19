import QRCodeDisplay from '../QRCodeDisplay';

export default function QRCodeDisplayExample() {
  return (
    <div className="p-8 flex items-center justify-center min-h-screen bg-muted">
      <QRCodeDisplay
        value="ORD-001-2024-11-02"
        title="Delivery Confirmation"
        description="Show this QR code to the delivery rider to confirm receipt"
      />
    </div>
  );
}
