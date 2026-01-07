import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Navigation, Package, MapPinOff, Battery, Wifi, WifiOff } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { riderLocationService } from "@/lib/riderLocationService";
import { useNotification } from "@/contexts/NotificationContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ActiveDelivery {
  id: string;
  orderNumber: string;
  status: string;
  currentLocation: string;
  destination: string;
  distance: string;
  estimatedTime: string;
}

export default function RiderActiveRoute() {
  const { user } = useAuth();
  const { socket } = useNotification();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);

  const { data: activeDelivery, isLoading } = useQuery<ActiveDelivery>({
    queryKey: ["/api/deliveries/active"],
    queryFn: async () => {
      const res = await fetch("/api/deliveries/active");
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch active route");
      }
      return res.json();
    },
  });

  // Initialize geolocation with tracking callbacks
  const {
    position,
    error: geoError,
    permissionState,
    isLoading: geoLoading,
    requestPermission,
    startWatching,
    stopWatching,
    isWatching
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
    onPositionUpdate: (pos) => {
      // Position updates are handled by riderLocationService
      console.log('Position updated:', pos);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Location Error',
        description: error.message,
      });
    }
  });

  // Start/stop tracking based on active delivery
  useEffect(() => {
    if (activeDelivery && socket && user?.id && !isTracking) {
      const startTracking = async () => {
        try {
          // Request permission first
          const hasPermission = await requestPermission();
          if (!hasPermission) return;

          // Start watching position
          await startWatching();

          // Start location service
          await riderLocationService.startTracking(
            parseInt(user.id),
            socket,
            parseInt(activeDelivery.id)
          );

          setIsTracking(true);
          toast({
            title: 'Tracking Started',
            description: 'Your location is now being shared',
          });
        } catch (error: any) {
          toast({
            variant: 'destructive',
            title: 'Tracking Failed',
            description: error.message,
          });
        }
      };

      startTracking();
    }

    // Cleanup on unmount or when delivery is completed
    return () => {
      if (isTracking) {
        stopWatching();
        riderLocationService.stopTracking();
        setIsTracking(false);
      }
    };
  }, [activeDelivery, socket, user, isTracking]);

  const handleStopTracking = () => {
    stopWatching();
    riderLocationService.stopTracking();
    setIsTracking(false);
    toast({
      title: 'Tracking Stopped',
      description: 'Location sharing has been disabled',
    });
  };

  return (
    <DashboardLayout role="rider">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Active Route</h1>
          <p className="text-muted-foreground">Your current delivery route</p>
        </div>

        {/* Location Status Alert */}
        {activeDelivery && (
          <Alert className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isWatching ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <AlertTitle>Location Tracking Active</AlertTitle>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-amber-500" />
                    <AlertTitle>Location Tracking Inactive</AlertTitle>
                  </>
                )}
              </div>
              {position && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>Accuracy: {position.accuracy.toFixed(0)}m</span>
                </div>
              )}
            </div>
            <AlertDescription>
              {isWatching 
                ? 'Your location is being shared with customers and admins in real-time'
                : geoError 
                  ? `Error: ${geoError}`
                  : permissionState === 'denied'
                    ? 'Location permission denied. Please enable it in your browser settings.'
                    : 'Enable location tracking to share your delivery progress'}
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !activeDelivery ? (
          <Card className="p-12">
            <div className="text-center">
              <Navigation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Route</h3>
              <p className="text-muted-foreground">You don't have any active deliveries at the moment</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="p-6" data-testid="card-active-delivery">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-semibold text-lg">Order #{activeDelivery.orderNumber}</p>
                      <Badge className="bg-blue-500 text-white mt-1">
                        {activeDelivery.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Current Location</p>
                      <p className="text-muted-foreground">{activeDelivery.currentLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Destination</p>
                      <p className="text-muted-foreground">{activeDelivery.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Distance</p>
                    <p className="text-lg font-semibold">{activeDelivery.distance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Est. Time</p>
                    <p className="text-lg font-semibold">{activeDelivery.estimatedTime}</p>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  data-testid="button-navigate"
                  onClick={() => {
                    // Open Google Maps with the destination address
                    const destination = encodeURIComponent(activeDelivery.destination);
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Start Navigation
                </Button>
                
                {isWatching && (
                  <Button 
                    className="w-full mt-2" 
                    variant="destructive"
                    onClick={handleStopTracking}
                    data-testid="button-stop-tracking"
                  >
                    <MapPinOff className="h-4 w-4 mr-2" />
                    Stop Location Sharing
                  </Button>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">Route Map</h3>
              <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Map integration coming soon...</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
