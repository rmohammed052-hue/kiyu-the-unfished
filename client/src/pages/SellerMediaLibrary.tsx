import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Upload, Trash2, Copy, Loader2, Image as ImageIcon, Check } from "lucide-react";
import type { MediaLibrary } from "@shared/schema";

export default function SellerMediaLibrary() {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    url: "",
    filename: "",
    altText: "",
    tags: "",
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  const { data: mediaItems = [], isLoading } = useQuery<MediaLibrary[]>({
    queryKey: ["/api/media-library", "product"],
    queryFn: async () => {
      const res = await fetch("/api/media-library?category=product");
      const data = await res.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadForm) => {
      return apiRequest("POST", "/api/media-library", {
        ...data,
        category: "product",
        tags: data.tags ? data.tags.split(",").map(t => t.trim()) : [],
        isTemporary: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      toast({
        title: "Success",
        description: "Product image uploaded successfully",
      });
      setUploadDialogOpen(false);
      setUploadForm({
        url: "",
        filename: "",
        altText: "",
        tags: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/media-library/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      setSelectedImages(new Set());
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => apiRequest("DELETE", `/api/media-library/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      setSelectedImages(new Set());
      toast({
        title: "Success",
        description: `${selectedImages.size} items deleted successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete images",
        variant: "destructive",
      });
    },
  });

  const toggleImageSelection = (id: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedImages(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedImages.size === mediaItems.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(mediaItems.map(item => item.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedImages.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedImages.size} selected item(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedImages));
    }
  };

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Image URL copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout role="seller" showBackButton>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Product Image Library</h1>
          <p className="text-muted-foreground">Manage reusable product images for your store</p>
        </div>
        <div className="flex items-center gap-2">
          {mediaItems.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                data-testid="button-select-all"
              >
                {selectedImages.size === mediaItems.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedImages.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  data-testid="button-bulk-delete"
                >
                  {bulkDeleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete ({selectedImages.size})
                    </>
                  )}
                </Button>
              )}
            </>
          )}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-media">
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
            </DialogTrigger>
          <DialogContent data-testid="dialog-upload-media">
            <DialogHeader>
              <DialogTitle>Upload Product Image</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url">Image URL *</Label>
                <Input
                  id="url"
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                  placeholder="https://example.com/product-image.jpg"
                  data-testid="input-media-url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload images to Cloudinary (configured in Admin Settings) or use external URLs
                </p>
              </div>
              <div>
                <Label htmlFor="filename">Filename *</Label>
                <Input
                  id="filename"
                  value={uploadForm.filename}
                  onChange={(e) => setUploadForm({ ...uploadForm, filename: e.target.value })}
                  placeholder="elegant-abaya.jpg"
                  data-testid="input-media-filename"
                />
              </div>
              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={uploadForm.altText}
                  onChange={(e) => setUploadForm({ ...uploadForm, altText: e.target.value })}
                  placeholder="Description of the product"
                  data-testid="input-media-alt"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="abaya, modest, fashion"
                  data-testid="input-media-tags"
                />
              </div>
              <Button
                onClick={() => uploadMutation.mutate(uploadForm)}
                disabled={!uploadForm.url || !uploadForm.filename || uploadMutation.isPending}
                className="w-full"
                data-testid="button-submit-media"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : mediaItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No product images found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first product image to get started. You can reuse these images across multiple products.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mediaItems.map((item) => (
            <Card key={item.id} className={`overflow-hidden ${selectedImages.has(item.id) ? 'ring-2 ring-primary' : ''}`} data-testid={`media-card-${item.id}`}>
              <div className="aspect-square bg-muted relative">
                <img
                  src={item.url}
                  alt={item.altText || item.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={selectedImages.has(item.id)}
                    onCheckedChange={() => toggleImageSelection(item.id)}
                    className="bg-white"
                    data-testid={`checkbox-select-${item.id}`}
                  />
                </div>
                {item.isTemporary && (
                  <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Sample
                  </div>
                )}
                {item.uploaderRole === "admin" && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Platform
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <p className="font-semibold text-sm truncate mb-2" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  {item.tags && item.tags.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {item.tags.slice(0, 2).join(", ")}
                      {item.tags.length > 2 && ` +${item.tags.length - 2}`}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyToClipboard(item.url, item.id)}
                    data-testid={`button-copy-${item.id}`}
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                  {item.uploaderRole !== "admin" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this image?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
