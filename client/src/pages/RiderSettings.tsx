import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, Truck, Settings as SettingsIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function RiderSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [deliveryNotifications, setDeliveryNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  const handleSavePreferences = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  return (
    <DashboardLayout role="rider">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Settings</h1>
          <p className="text-muted-foreground">Manage your rider account settings</p>
        </div>

        <div className="space-y-6">
          <Card data-testid="card-notifications">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="delivery-notifications" className="text-base">
                    Delivery Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new delivery assignments
                  </p>
                </div>
                <Switch
                  id="delivery-notifications"
                  checked={deliveryNotifications}
                  onCheckedChange={setDeliveryNotifications}
                  data-testid="switch-delivery-notifications"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-base">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email-notifications"
                />
              </div>

              <div className="pt-4">
                <Button onClick={handleSavePreferences} data-testid="button-save">
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-delivery-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Settings
              </CardTitle>
              <CardDescription>
                Configure your delivery preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="location-sharing" className="text-base">
                    Location Sharing
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Share your location during deliveries
                  </p>
                </div>
                <Switch
                  id="location-sharing"
                  checked={locationSharing}
                  onCheckedChange={setLocationSharing}
                  data-testid="switch-location-sharing"
                />
              </div>
              <div className="pt-4">
                <Button onClick={() => navigate("/profile")} data-testid="button-edit-profile">
                  Edit Vehicle Information
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-account-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" onClick={() => navigate("/change-password")} data-testid="button-change-password">
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
