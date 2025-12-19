import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QRCode from "react-qr-code";

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  description?: string;
  size?: number;
}

export default function QRCodeDisplay({
  value,
  title = "Delivery Confirmation",
  description = "Show this QR code to the delivery rider",
  size = 200,
}: QRCodeDisplayProps) {
  return (
    <div className="w-full">
      {title && (
        <div className="text-center mb-2">
          <h3 className="font-semibold text-sm">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="flex justify-center items-center">
        <div className="p-4 !bg-white rounded-lg shadow-sm">
          <QRCode value={value} size={size} data-testid="qr-code" />
        </div>
      </div>
    </div>
  );
}
