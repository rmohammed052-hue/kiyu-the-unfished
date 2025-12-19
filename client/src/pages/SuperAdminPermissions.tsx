import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, ArrowLeft, Save } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RoleFeature {
  id: string;
  role: string;
  features: Record<string, boolean>;
  updatedAt: string;
  updatedBy: string;
}

// Feature manifest defining all available features by role
const FEATURE_MANIFEST: Record<string, { label: string; description: string; category: string }> = {
  // Product Management
  "products.create": { label: "Create Products", description: "Allow creating new products", category: "Product Management" },
  "products.edit": { label: "Edit Products", description: "Allow editing product details", category: "Product Management" },
  "products.delete": { label: "Delete Products", description: "Allow deleting products", category: "Product Management" },
  "products.viewAll": { label: "View All Products", description: "View products from all sellers", category: "Product Management" },
  
  // Order Management
  "orders.view": { label: "View Orders", description: "View order listings", category: "Order Management" },
  "orders.manage": { label: "Manage Orders", description: "Update order status and details", category: "Order Management" },
  "orders.cancel": { label: "Cancel Orders", description: "Cancel customer orders", category: "Order Management" },
  
  // User Management
  "users.view": { label: "View Users", description: "Access user listings", category: "User Management" },
  "users.create": { label: "Create Users", description: "Create new user accounts", category: "User Management" },
  "users.edit": { label: "Edit Users", description: "Edit user details", category: "User Management" },
  "users.delete": { label: "Delete Users", description: "Delete user accounts", category: "User Management" },
  "users.approve": { label: "Approve Applications", description: "Approve seller/rider applications", category: "User Management" },
  
  // Platform Settings
  "settings.view": { label: "View Settings", description: "View platform settings", category: "Platform Settings" },
  "settings.edit": { label: "Edit Settings", description: "Modify platform settings", category: "Platform Settings" },
  "branding.edit": { label: "Edit Branding", description: "Customize platform branding", category: "Platform Settings" },
  
  // Content Management
  "banners.manage": { label: "Manage Banners", description: "Create and edit banners", category: "Content Management" },
  "categories.manage": { label: "Manage Categories", description: "Create and edit categories", category: "Content Management" },
  
  // Reports & Analytics
  "analytics.view": { label: "View Analytics", description: "Access analytics and reports", category: "Reports & Analytics" },
  "reports.generate": { label: "Generate Reports", description: "Create custom reports", category: "Reports & Analytics" },
};

const DEFAULT_FEATURES: Record<string, Record<string, boolean>> = {
  admin: {
    "products.viewAll": true,
    "orders.view": true,
    "orders.manage": true,
    "users.view": true,
    "users.approve": true,
    "settings.view": true,
    "banners.manage": true,
    "categories.manage": true,
    "analytics.view": true,
  },
  seller: {
    "products.create": true,
    "products.edit": true,
    "products.delete": true,
    "orders.view": true,
  },
  rider: {
    "orders.view": true,
  },
};

export default function SuperAdminPermissions() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [localFeatures, setLocalFeatures] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "super_admin")) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const { data: roleFeatures = [], isLoading } = useQuery<RoleFeature[]>({
    queryKey: ["/api/role-features"],
    queryFn: async () => {
      const res = await fetch("/api/role-features", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch role features");
      return res.json();
    },
    enabled: isAuthenticated && user?.role === "super_admin",
  });

  const updateFeaturesMutation = useMutation({
    mutationFn: async ({ role, features }: { role: string; features: Record<string, boolean> }) => {
      return apiRequest("PUT", `/api/role-features/${role}`, { features });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/role-features"] });
      setHasChanges(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const currentRole = roleFeatures.find(rf => rf.role === selectedRole);
    if (currentRole) {
      setLocalFeatures(currentRole.features);
    } else {
      // Load defaults if no configuration exists
      setLocalFeatures(DEFAULT_FEATURES[selectedRole] || {});
    }
    setHasChanges(false);
  }, [selectedRole, roleFeatures]);

  const handleToggleFeature = (featureKey: string, enabled: boolean) => {
    setLocalFeatures(prev => ({ ...prev, [featureKey]: enabled }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateFeaturesMutation.mutate({
      role: selectedRole,
      features: localFeatures,
    });
  };

  const handleReset = () => {
    const currentRole = roleFeatures.find(rf => rf.role === selectedRole);
    if (currentRole) {
      setLocalFeatures(currentRole.features);
    } else {
      setLocalFeatures(DEFAULT_FEATURES[selectedRole] || {});
    }
    setHasChanges(false);
  };

  if (authLoading || !isAuthenticated || user?.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group features by category
  const featuresByCategory: Record<string, string[]> = {};
  Object.keys(FEATURE_MANIFEST).forEach(key => {
    const category = FEATURE_MANIFEST[key].category;
    if (!featuresByCategory[category]) {
      featuresByCategory[category] = [];
    }
    featuresByCategory[category].push(key);
  });

  return (
    <DashboardLayout role="super_admin">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2" data-testid="heading-permissions">
              <Shield className="h-8 w-8 text-primary" />
              Role Permissions Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure feature access for different user roles
            </p>
          </div>
          {hasChanges && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                data-testid="button-reset"
              >
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateFeaturesMutation.isPending}
                data-testid="button-save"
                className="gap-2"
              >
                {updateFeaturesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          {/* Role Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Role</CardTitle>
              <CardDescription>Choose a role to configure its permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {["admin", "seller", "rider"].map((role) => (
                  <Button
                    key={role}
                    variant={selectedRole === role ? "default" : "outline"}
                    onClick={() => setSelectedRole(role)}
                    data-testid={`button-role-${role}`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features by Category */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {Object.keys(featuresByCategory).map((category) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {featuresByCategory[category].map((featureKey) => {
                      const feature = FEATURE_MANIFEST[featureKey];
                      const isEnabled = localFeatures[featureKey] || false;
                      
                      return (
                        <div key={featureKey} className="flex items-center justify-between space-x-4">
                          <div className="flex-1">
                            <Label
                              htmlFor={featureKey}
                              className="text-base font-medium cursor-pointer"
                              data-testid={`label-${featureKey}`}
                            >
                              {feature.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                          <Switch
                            id={featureKey}
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleToggleFeature(featureKey, checked)}
                            data-testid={`switch-${featureKey}`}
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
