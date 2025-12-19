import { useEffect } from "react";
import { useLocation } from "wouter";
import { XCircle, Home, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

export default function PaymentFailure() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const reason = searchParams.get("reason") || "Payment could not be completed";
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Show in-app notification only if there's a meaningful reason
    if (reason && reason !== "Payment could not be completed") {
      toast({
        title: "Payment Failed",
        description: reason,
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [reason, toast]);

  const handleRetry = () => {
    if (orderId) {
      // Navigate back to checkout with the order
      navigate("/checkout");
    } else {
      // Navigate to cart if no order ID
      navigate("/cart");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Failure Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-destructive" data-testid="text-failure-title">
              Payment Failed
            </h1>
            <p className="text-muted-foreground text-lg">
              We couldn't process your payment. Please try again.
            </p>
          </div>

          {/* Error Details */}
          <Alert variant="destructive" className="mb-6" data-testid="alert-error">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              {reason}
            </AlertDescription>
          </Alert>

          {/* Help Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Common Issues
              </CardTitle>
              <CardDescription>
                Here are some reasons why your payment might have failed:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Insufficient Funds</p>
                    <p className="text-muted-foreground">
                      Make sure your card has enough balance to complete the transaction
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Incorrect Card Details</p>
                    <p className="text-muted-foreground">
                      Double-check your card number, CVV, and expiry date
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Card Declined</p>
                    <p className="text-muted-foreground">
                      Your bank may have declined the transaction. Contact your bank for more information
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Network Issues</p>
                    <p className="text-muted-foreground">
                      Poor internet connection may have interrupted the payment process
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium">International Transactions</p>
                    <p className="text-muted-foreground">
                      Ensure your card is enabled for online/international transactions
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={handleRetry}
              size="lg"
              className="w-full"
              data-testid="button-retry"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="lg"
              className="w-full"
              data-testid="button-go-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>

          {/* Support Information */}
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Need help with your payment?
                </p>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/chat")}
                  className="text-primary hover:text-primary"
                  data-testid="button-contact-support"
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
