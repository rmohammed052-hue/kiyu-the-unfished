import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getUserFriendlyError } from "@/lib/errorMessages";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Trash2, Copy, Loader2, Image as ImageIcon, Check, FolderOpen } from "lucide-react";
import type { MediaLibrary } from "@shared/schema";

interface AssetImage {
  filename: string;
  url: string;
  path: string;
  size: number;
}

export default function AdminMediaLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("assets");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    url: "",
    category: "banner",
    filename: "",
    altText: "",
    tags: "",
  });
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  // Fetch available asset images
  const { data: assetImages = [], isLoading: assetsLoading } = useQuery<AssetImage[]>({
    queryKey: ["/api/assets/images"],
  });

  // Fetch uploaded media from database
  const { data: mediaItems = [], isLoading: mediaLoading } = useQuery<MediaLibrary[]>({
    queryKey: ["/api/media-library", selectedCategory],
    queryFn: async () => {
      const params = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
      const res = await fetch(`/api/media-library${params}`);
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadForm) => {
      return apiRequest("POST", "/api/media-library", {
        ...data,
        tags: data.tags ? data.tags.split(",").map(t => t.trim()) : [],
        isTemporary: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media-library"] });
      toast({
        title: "Success",
        description: "Media uploaded successfully",
      });
      setUploadDialogOpen(false);
      setUploadForm({
        url: "",
        category: "banner",
        filename: "",
        altText: "",
        tags: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
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
        description: "Media deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
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
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    },
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (path: string) => {
      return apiRequest("DELETE", `/api/assets/delete`, { path });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets/images"] });
      setSelectedAssets(new Set());
      toast({
        title: "Success",
        description: "Asset deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    },
  });

  const bulkDeleteAssetsMutation = useMutation({
    mutationFn: async (paths: string[]) => {
      await Promise.all(paths.map(path => apiRequest("DELETE", `/api/assets/delete`, { path })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets/images"] });
      setSelectedAssets(new Set());
      toast({
        title: "Success",
        description: `${selectedAssets.size} assets deleted successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
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

  const toggleAssetSelection = (path: string) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedAssets(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedImages.size === filteredItems.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredItems.map(item => item.id)));
    }
  };

  const toggleSelectAllAssets = () => {
    if (selectedAssets.size === assetImages.length) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(assetImages.map(asset => asset.path)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedImages.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedImages.size} selected item(s)?`)) {
      bulkDeleteMutation.mutate(Array.from(selectedImages));
    }
  };

  const handleBulkDeleteAssets = () => {
    if (selectedAssets.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedAssets.size} selected asset(s)?`)) {
      bulkDeleteAssetsMutation.mutate(Array.from(selectedAssets));
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    toast({
      title: "Copied!",
      description: "Image URL copied to clipboard",
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const categories = [
    { value: "all", label: "All Media" },
    { value: "banner", label: "Banners" },
    { value: "category", label: "Categories" },
    { value: "logo", label: "Logos" },
    { value: "product", label: "Products" },
    { value: "general", label: "General" },
  ];

  const filteredItems = selectedCategory === "all" 
    ? mediaItems || []
    : (mediaItems || []).filter(item => item.category === selectedCategory);

  return (
    <DashboardLayout role={user?.role as any}>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">Browse available assets and manage uploaded media</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-media">
              <Upload className="mr-2 h-4 w-4" />
              Upload New Media
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-upload-media">
            <DialogHeader>
              <DialogTitle>Upload Media</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="url">Image URL *</Label>
                <Input
                  id="url"
                  value={uploadForm.url}
                  onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-media-url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload images to Cloudinary or use external URLs
                </p>
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={uploadForm.category}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
                >
                  <SelectTrigger data-testid="select-media-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="logo">Logo</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="filename">Filename *</Label>
                <Input
                  id="filename"
                  value={uploadForm.filename}
                  onChange={(e) => setUploadForm({ ...uploadForm, filename: e.target.value })}
                  placeholder="hero-banner.jpg"
                  data-testid="input-media-filename"
                />
              </div>
              <div>
                <Label htmlFor="altText">Alt Text</Label>
                <Input
                  id="altText"
                  value={uploadForm.altText}
                  onChange={(e) => setUploadForm({ ...uploadForm, altText: e.target.value })}
                  placeholder="Description of the image"
                  data-testid="input-media-alt"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="fashion, banner, promo"
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assets" data-testid="tab-assets">
            <FolderOpen className="mr-2 h-4 w-4" />
            Available Assets ({assetImages.length})
          </TabsTrigger>
          <TabsTrigger value="uploaded" data-testid="tab-uploaded">
            <Upload className="mr-2 h-4 w-4" />
            Uploaded Media ({mediaItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Available Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Browse all images from your attached_assets folder. Click copy to use them in your application.
            </p>
            {assetImages.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAllAssets}
                  data-testid="button-select-all-assets"
                >
                  {selectedAssets.size === assetImages.length ? "Deselect All" : "Select All"}
                </Button>
                {selectedAssets.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDeleteAssets}
                    disabled={bulkDeleteAssetsMutation.isPending}
                    data-testid="button-bulk-delete-assets"
                  >
                    {bulkDeleteAssetsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedAssets.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
          {assetsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : assetImages.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assets found</h3>
                <p className="text-muted-foreground text-center">
                  No images found in attached_assets folder
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {assetImages.map((asset, index) => (
                <Card key={index} className={`overflow-hidden ${selectedAssets.has(asset.path) ? 'ring-2 ring-primary' : ''}`} data-testid={`asset-card-${index}`}>
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedAssets.has(asset.path)}
                        onCheckedChange={() => toggleAssetSelection(asset.path)}
                        className="bg-white"
                        data-testid={`checkbox-select-asset-${index}`}
                      />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm truncate mb-2" title={asset.filename}>
                      {asset.filename}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3 truncate" title={asset.path}>
                      {asset.path}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(asset.url)}
                        data-testid={`button-copy-asset-${index}`}
                      >
                        {copiedUrl === asset.url ? (
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this asset?")) {
                            deleteAssetMutation.mutate(asset.path);
                          }
                        }}
                        data-testid={`button-delete-asset-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Uploaded Media Tab */}
        <TabsContent value="uploaded" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1">
              <TabsList>
                {categories.map((cat) => (
                  <TabsTrigger key={cat.value} value={cat.value} data-testid={`tab-category-${cat.value}`}>
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {filteredItems.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  data-testid="button-select-all"
                >
                  {selectedImages.size === filteredItems.length ? "Deselect All" : "Select All"}
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
              </div>
            )}
          </div>

          {mediaLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No media found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Upload your first image to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className={`overflow-hidden ${selectedImages.has(item.id) ? 'ring-2 ring-primary' : ''}`} data-testid={`media-card-${item.id}`}>
                  <div className="aspect-video bg-muted relative">
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
                        Temporary
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm truncate mb-2" title={item.filename}>
                      {item.filename}
                    </p>
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {item.category}
                      </span>
                      {item.tags && item.tags.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          +{item.tags.length} tags
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(item.url)}
                        data-testid={`button-copy-${item.id}`}
                      >
                        {copiedUrl === item.url ? (
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this media?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
