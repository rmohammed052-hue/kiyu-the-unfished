import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PaymentVerify() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Extract reference from URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const reference = urlParams.get('reference');
        const trxref = urlParams.get('trxref'); // Paystack also sends trxref
        
        const paymentReference = reference || trxref;

        if (!paymentReference) {
          setError('No payment reference found in URL');
          setVerifying(false);
          return;
        }

        console.log('🔍 Verifying payment reference:', paymentReference);

        // Call verification API
        const res = await apiRequest('POST', '/api/payments/verify', {
          reference: paymentReference
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.userMessage || data.error || 'Payment verification failed');
        }

        console.log('✅ Payment verified successfully:', data);

        // Show success toast
        toast({
          title: "Payment Successful",
          description: data.message || "Your payment has been confirmed!",
        });

        // Store order ID(s) for redirect
        if (data.isMultiVendor) {
          // Multi-vendor: Redirect to general success page
          setTimeout(() => {
            navigate('/payment-success?session=multi-vendor');
          }, 1000);
        } else {
          // Single order: Redirect with order ID
          setOrderId(data.orderId);
          setTimeout(() => {
            navigate(`/payment-success?orderId=${data.orderId}`);
          }, 1000);
        }

        setVerifying(false);
      } catch (err: any) {
        console.error('❌ Payment verification error:', err);
        setError(err.message || 'An error occurred while verifying your payment');
        setVerifying(false);

        toast({
          title: "Payment Verification Failed",
          description: err.message || "An error occurred while verifying your payment",
          variant: "destructive",
        });
      }
    };

    verifyPayment();
  }, [navigate, toast]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" data-testid="loader-verify" />
            </div>
            <CardTitle className="text-2xl">Verifying Payment</CardTitle>
            <CardDescription>
              Please wait while we confirm your payment with our payment gateway...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            <p>This usually takes just a few seconds.</p>
            <p className="mt-2">Do not close this page or press the back button.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-destructive" data-testid="icon-error" />
            </div>
            <CardTitle className="text-2xl text-destructive">Payment Verification Failed</CardTitle>
            <CardDescription className="text-base mt-2">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">What should I do?</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Check your order history to see if payment was successful</li>
                <li>Contact support if you were charged but order not found</li>
                <li>Try placing your order again if payment wasn't processed</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/orders')}
                data-testid="button-view-orders"
              >
                View Orders
              </Button>
              <Button
                className="flex-1"
                onClick={() => navigate('/contact')}
                data-testid="button-contact-support"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state (brief display before redirect)
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-green-500">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" data-testid="icon-success" />
          </div>
          <CardTitle className="text-2xl text-green-500">Payment Verified!</CardTitle>
          <CardDescription className="text-base mt-2">
            Your payment has been successfully confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Redirecting you to your order details...</p>
        </CardContent>
      </Card>
    </div>
  );
}
