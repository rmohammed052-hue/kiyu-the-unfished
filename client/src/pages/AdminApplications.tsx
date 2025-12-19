import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Store, Bike, Check, X, ArrowLeft, Eye, MapPin, CreditCard, User, Car, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isApproved: boolean;
  applicationStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  createdAt: string;
  profileImage?: string;
  ghanaCardFront?: string;
  ghanaCardBack?: string;
  nationalIdCard?: string;
  businessAddress?: string;
  storeName?: string;
  storeDescription?: string;
  vehicleInfo?: {
    type: string;
    plateNumber?: string;
    license?: string;
    color?: string;
  };
}

export default function AdminApplications() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin"))) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  // Pending Seller Applications
  const { data: pendingSellerApplications = [], isLoading: pendingSellersLoading } = useQuery<Application[]>({
    queryKey: ["/api/users", "seller", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/users?role=seller&isApproved=false&applicationStatus=pending", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin"),
  });

  // Pending Rider Applications
  const { data: pendingRiderApplications = [], isLoading: pendingRidersLoading } = useQuery<Application[]>({
    queryKey: ["/api/users", "rider", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/users?role=rider&isApproved=false&applicationStatus=pending", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin"),
  });

  // Rejected Seller Applications
  const { data: rejectedSellerApplications = [], isLoading: rejectedSellersLoading } = useQuery<Application[]>({
    queryKey: ["/api/users", "seller", "rejected"],
    queryFn: async () => {
      const res = await fetch("/api/users?role=seller&applicationStatus=rejected", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin"),
  });

  // Rejected Rider Applications
  const { data: rejectedRiderApplications = [], isLoading: rejectedRidersLoading } = useQuery<Application[]>({
    queryKey: ["/api/users", "rider", "rejected"],
    queryFn: async () => {
      const res = await fetch("/api/users?role=rider&applicationStatus=rejected", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    enabled: isAuthenticated && (user?.role === "admin" || user?.role === "super_admin"),
  });

  const approveApplicationMutation = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      return apiRequest("PATCH", `/api/users/${userId}/approve`, {});
    },
    onSuccess: async () => {
      toast({
        title: "Success",
        description: "Application approved successfully",
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/stores/my-store"] });
      setViewDetailsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve application",
        variant: "destructive",
      });
    },
  });

  const rejectApplicationMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      return apiRequest("PATCH", `/api/users/${userId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setViewDetailsOpen(false);
      setRejectDialogOpen(false);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject application",
        variant: "destructive",
      });
    },
  });

  const openDetails = (application: Application) => {
    setSelectedApplication(application);
    setViewDetailsOpen(true);
  };

  const openRejectDialog = (application: Application) => {
    setSelectedApplication(application);
    setRejectDialogOpen(true);
  };

  const handleReject = () => {
    if (selectedApplication) {
      rejectApplicationMutation.mutate({
        userId: selectedApplication.id,
        reason: rejectionReason.trim() || undefined,
      });
    }
  };

  if (authLoading || !isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ApplicationCard = ({ 
    application, 
    type, 
    status 
  }: { 
    application: Application; 
    type: "seller" | "rider"; 
    status: "pending" | "rejected";
  }) => (
    <Card className="p-4 hover:shadow-md transition-shadow" data-testid={`card-${type}-${application.id}`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${type === "seller" ? "bg-blue-500/10" : "bg-orange-500/10"}`}>
          {type === "seller" ? (
            <Store className="h-6 w-6 text-blue-500" />
          ) : (
            <Bike className="h-6 w-6 text-orange-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg" data-testid={`text-name-${application.id}`}>
                {application.name}
              </h3>
              {application.profileImage && (
                <div className="mt-2">
                  <img 
                    src={application.profileImage} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid={`text-email-${application.id}`}>
              <span className="font-medium">Email:</span> {application.email}
            </p>
            {application.phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid={`text-phone-${application.id}`}>
                <span className="font-medium">Phone:</span> {application.phone}
              </p>
            )}
            {application.businessAddress && (
              <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid={`text-location-${application.id}`}>
                <MapPin className="h-3 w-3" />
                <span className="font-medium">Location:</span> {application.businessAddress}
              </p>
            )}
            {type === "seller" && application.storeName && (
              <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid={`text-store-${application.id}`}>
                <Store className="h-3 w-3" />
                <span className="font-medium">Store:</span> {application.storeName}
              </p>
            )}
            {type === "rider" && application.vehicleInfo && (
              <p className="text-sm text-muted-foreground flex items-center gap-2" data-testid={`text-vehicle-${application.id}`}>
                <Car className="h-3 w-3" />
                <span className="font-medium">Vehicle:</span> {application.vehicleInfo.type}
              </p>
            )}
            {status === "rejected" && application.rejectionReason && (
              <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                <p className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  Rejection Reason:
                </p>
                <p className="text-sm text-muted-foreground mt-1">{application.rejectionReason}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2" data-testid={`text-date-${application.id}`}>
              Applied: {new Date(application.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDetails(application)}
            data-testid={`button-view-${application.id}`}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
          {status === "pending" && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => approveApplicationMutation.mutate({ userId: application.id })}
                disabled={approveApplicationMutation.isPending}
                data-testid={`button-approve-${application.id}`}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => openRejectDialog(application)}
                disabled={rejectApplicationMutation.isPending}
                data-testid={`button-reject-${application.id}`}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <DashboardLayout role={user?.role as any}>
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
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-applications">
              Applications
            </h1>
            <p className="text-muted-foreground mt-1">Review and approve seller and rider applications</p>
          </div>
        </div>

        <Tabs defaultValue="sellers" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="sellers" data-testid="tab-sellers">
              Pending Sellers ({pendingSellerApplications.length})
            </TabsTrigger>
            <TabsTrigger value="riders" data-testid="tab-riders">
              Pending Riders ({pendingRiderApplications.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" data-testid="tab-rejected">
              Rejected ({rejectedSellerApplications.length + rejectedRiderApplications.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sellers" className="mt-6">
            {pendingSellersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingSellerApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} type="seller" status="pending" />
                ))}
                
                {pendingSellerApplications.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground" data-testid="text-no-sellers">
                      No pending seller applications
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="riders" className="mt-6">
            {pendingRidersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingRiderApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} type="rider" status="pending" />
                ))}
                
                {pendingRiderApplications.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground" data-testid="text-no-riders">
                      No pending rider applications
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {rejectedSellersLoading || rejectedRidersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-6">
                {rejectedSellerApplications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Rejected Sellers</h3>
                    <div className="grid gap-4">
                      {rejectedSellerApplications.map((application) => (
                        <ApplicationCard key={application.id} application={application} type="seller" status="rejected" />
                      ))}
                    </div>
                  </div>
                )}
                
                {rejectedRiderApplications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Rejected Riders</h3>
                    <div className="grid gap-4">
                      {rejectedRiderApplications.map((application) => (
                        <ApplicationCard key={application.id} application={application} type="rider" status="rejected" />
                      ))}
                    </div>
                  </div>
                )}
                
                {rejectedSellerApplications.length === 0 && rejectedRiderApplications.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground" data-testid="text-no-rejected">
                      No rejected applications
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Rejection Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                Are you sure you want to reject {selectedApplication?.name}'s application? 
                You can optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">Rejection Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Incomplete documentation, invalid Ghana Card, etc."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-2"
                  rows={4}
                  data-testid="input-rejection-reason"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                }}
                data-testid="button-cancel-reject"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectApplicationMutation.isPending}
                data-testid="button-confirm-reject"
                className="gap-2"
              >
                {rejectApplicationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                Reject Application
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Application Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedApplication && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    {selectedApplication.role === "seller" ? (
                      <Store className="h-6 w-6 text-blue-500" />
                    ) : (
                      <Bike className="h-6 w-6 text-orange-500" />
                    )}
                    {selectedApplication.name}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedApplication.role === "seller" ? "Seller" : "Delivery Rider"} Application Details
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Rejection Reason (if rejected) */}
                  {selectedApplication.applicationStatus === "rejected" && selectedApplication.rejectionReason && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        <h3 className="text-lg font-semibold text-destructive">Rejection Reason</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedApplication.rejectionReason}</p>
                    </div>
                  )}

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                        <p className="text-base">{selectedApplication.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-base">{selectedApplication.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Phone</p>
                        <p className="text-base">{selectedApplication.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Ghana Card Number</p>
                        <p className="text-base">{selectedApplication.nationalIdCard || "N/A"}</p>
                      </div>
                      {selectedApplication.businessAddress && (
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Address / Location</p>
                          <p className="text-base">{selectedApplication.businessAddress}</p>
                        </div>
                      )}
                      {selectedApplication.storeName && (
                        <>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Store Name</p>
                            <p className="text-base">{selectedApplication.storeName}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-muted-foreground">Store Description</p>
                            <p className="text-base">{selectedApplication.storeDescription || "N/A"}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Profile Picture */}
                  {selectedApplication.profileImage && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Photo
                      </h3>
                      <div className="bg-muted rounded-lg p-4 inline-block">
                        <img 
                          src={selectedApplication.profileImage} 
                          alt="Profile" 
                          className="w-48 h-48 rounded-lg object-cover border-2 border-border"
                        />
                      </div>
                    </div>
                  )}

                  {/* Ghana Card Images */}
                  {(selectedApplication.ghanaCardFront || selectedApplication.ghanaCardBack) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Ghana Card Verification
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedApplication.ghanaCardFront && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Front</p>
                            <div className="bg-muted rounded-lg p-2">
                              <img 
                                src={selectedApplication.ghanaCardFront} 
                                alt="Ghana Card Front" 
                                className="w-full h-auto rounded object-contain"
                              />
                            </div>
                          </div>
                        )}
                        {selectedApplication.ghanaCardBack && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Back</p>
                            <div className="bg-muted rounded-lg p-2">
                              <img 
                                src={selectedApplication.ghanaCardBack} 
                                alt="Ghana Card Back" 
                                className="w-full h-auto rounded object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vehicle Information (for riders) */}
                  {selectedApplication.vehicleInfo && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Car className="h-5 w-5" />
                        Vehicle Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Vehicle Type</p>
                          <p className="text-base capitalize">{selectedApplication.vehicleInfo.type}</p>
                        </div>
                        {selectedApplication.vehicleInfo.plateNumber && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Plate Number</p>
                            <p className="text-base">{selectedApplication.vehicleInfo.plateNumber}</p>
                          </div>
                        )}
                        {selectedApplication.vehicleInfo.license && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">License Number</p>
                            <p className="text-base">{selectedApplication.vehicleInfo.license}</p>
                          </div>
                        )}
                        {selectedApplication.vehicleInfo.color && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Vehicle Color</p>
                            <p className="text-base">{selectedApplication.vehicleInfo.color}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedApplication.applicationStatus === "pending" && (
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setViewDetailsOpen(false)}
                        data-testid="button-close-details"
                      >
                        Close
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setViewDetailsOpen(false);
                          openRejectDialog(selectedApplication);
                        }}
                        data-testid="button-reject-details"
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Reject Application
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => approveApplicationMutation.mutate({ userId: selectedApplication.id })}
                        disabled={approveApplicationMutation.isPending}
                        data-testid="button-approve-details"
                        className="gap-2"
                      >
                        {approveApplicationMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Approve Application
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
