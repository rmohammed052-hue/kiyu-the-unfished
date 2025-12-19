import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Package, Edit, Trash2, Plus, Eye, AlertCircle, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MediaUploadInput from "@/components/MediaUploadInput";
import ProductGallery from "@/components/ProductGallery";
import { CategorySelect } from "@/components/CategorySelect";
import { DynamicFieldRenderer } from "@/components/DynamicFieldRenderer";
import { getStoreTypeFields, getStoreTypeSchema, StoreType } from "@shared/storeTypes";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  compareAtPrice: string | null;
  images: string[];
  video: string | null;
  category: string | null;
  categoryId: string | null;
  sellerId: string;
  storeId: string | null;
  stock: number;
  tags: string[] | null;
  isActive: boolean;
  createdAt: string;
  dynamicFields?: Record<string, any>;
}

interface Store {
  id: string;
  storeType: StoreType;
}

// Base product schema (media rules: 3-8 images required, video optional)
const baseProductSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  compareAtPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format").optional().or(z.literal("")),
  categoryId: z.string().optional(),
  stockQuantity: z.string().regex(/^\d+$/, "Must be a valid number"),
  tags: z.string().optional(),
  images: z.array(z.string().url()).min(3, "Minimum 3 product images required").max(8, "Maximum 8 images allowed"),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
  inStock: z.boolean().default(true),
  dynamicFields: z.record(z.any()).optional(),
});

function ProductFormDialog({ product, mode }: { product?: Product; mode: "create" | "edit" }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch seller's store to get storeType
  const { data: store } = useQuery<Store>({
    queryKey: ["/api/stores/my-store"],
    enabled: !!user?.id,
  });

  // Merge base schema with dynamic storeType schema
  const productSchema = useMemo(() => {
    if (!store?.storeType) return baseProductSchema;
    
    const dynamicSchema = getStoreTypeSchema(store.storeType);
    return baseProductSchema.extend({
      dynamicFields: dynamicSchema,
    });
  }, [store?.storeType]);

  type ProductFormData = z.infer<typeof productSchema>;

  // Get dynamic fields for rendering
  const dynamicFields = useMemo(() => {
    if (!store?.storeType) return [];
    return getStoreTypeFields(store.storeType);
  }, [store?.storeType]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice || "",
      categoryId: product.categoryId || undefined,
      stockQuantity: product.stock.toString(),
      tags: product.tags?.join(", ") || "",
      images: product.images || [],
      videoUrl: product.video || "",
      inStock: true,
      dynamicFields: product.dynamicFields || {},
    } : {
      name: "",
      description: "",
      price: "",
      compareAtPrice: "",
      categoryId: undefined,
      stockQuantity: "0",
      tags: "",
      images: [],
      videoUrl: "",
      inStock: true,
      dynamicFields: store?.storeType ? (() => {
        const fields = getStoreTypeFields(store.storeType);
        const defaults: Record<string, any> = {};
        fields.forEach(field => {
          if (field.type === "multiselect") {
            defaults[field.name] = [];
          } else if (field.type === "number") {
            defaults[field.name] = 0;
          } else {
            defaults[field.name] = "";
          }
        });
        return defaults;
      })() : {},
    },
  });

  // Reset form when store changes or dialog opens/closes
  useEffect(() => {
    if (open && store?.storeType) {
      const dynamicDefaults: Record<string, any> = {};
      const fields = getStoreTypeFields(store.storeType);
      fields.forEach(field => {
        if (field.type === "multiselect") {
          dynamicDefaults[field.name] = [];
        } else if (field.type === "number") {
          dynamicDefaults[field.name] = 0;
        } else {
          dynamicDefaults[field.name] = "";
        }
      });
      
      form.reset(product ? {
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice || "",
        categoryId: product.categoryId || undefined,
        stockQuantity: product.stock.toString(),
        tags: product.tags?.join(", ") || "",
        images: product.images || [],
        videoUrl: product.video || "",
        inStock: true,
        dynamicFields: {
          ...dynamicDefaults,
          ...(product.dynamicFields || {}),
        },
      } : {
        name: "",
        description: "",
        price: "",
        compareAtPrice: "",
        categoryId: undefined,
        stockQuantity: "0",
        tags: "",
        images: [],
        videoUrl: "",
        inStock: true,
        dynamicFields: dynamicDefaults,
      });
    }
  }, [open, store?.storeType, product, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const productData: any = {
        name: data.name,
        description: data.description,
        price: data.price,
        compareAtPrice: data.compareAtPrice || null,
        categoryId: data.categoryId,
        stock: parseInt(data.stockQuantity),
        images: data.images || [],
        video: data.videoUrl || null,
        sellerId: user.id,
        storeId: store?.id || null,
        dynamicFields: data.dynamicFields || {},
      };

      if (data.tags) {
        const tagsArray = data.tags.split(",").map(t => t.trim()).filter(Boolean);
        productData.tags = tagsArray;
      }

      return apiRequest("POST", "/api/products", productData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const updateData: any = {
        name: data.name,
        description: data.description,
        price: data.price,
        compareAtPrice: data.compareAtPrice || null,
        categoryId: data.categoryId,
        stock: parseInt(data.stockQuantity),
        images: data.images,
        video: data.videoUrl || null,
        dynamicFields: data.dynamicFields || {},
      };

      if (data.tags) {
        const tagsArray = data.tags.split(",").map(t => t.trim()).filter(Boolean);
        updateData.tags = tagsArray;
      }

      return apiRequest("PATCH", `/api/products/${product?.id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (mode === "create") {
      createProductMutation.mutate(data);
    } else {
      updateProductMutation.mutate(data);
    }
  };

  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button data-testid="button-create-product">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon"
            data-testid={`button-edit-${product?.id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Product" : "Edit Product"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Add a new product to your store" : "Update product information"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Elegant Black Abaya" {...field} data-testid="input-product-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your product..." 
                      {...field} 
                      data-testid="input-product-description"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="299.99" {...field} data-testid="input-product-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="compareAtPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare At Price (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="349.99" {...field} data-testid="input-product-compare-price" />
                    </FormControl>
                    <FormDescription>Original price for showing discounts</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <CategorySelect
                      value={field.value}
                      onValueChange={field.onChange}
                      storeType={store?.storeType}
                      label="Category"
                      required={false}
                      testId="select-category"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} data-testid="input-product-stock" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="modest, elegant, formal" {...field} data-testid="input-product-tags" />
                  </FormControl>
                  <FormDescription>Enter tags separated by commas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dynamic Store-Type Specific Fields */}
            {dynamicFields.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4">
                  {store?.storeType ? `${store.storeType.replace(/_/g, ' ')} Store Information` : 'Store-Specific Information'}
                </h3>
                <div className="space-y-4">
                  {dynamicFields.map((field) => (
                    <DynamicFieldRenderer
                      key={field.name}
                      field={field}
                      form={form}
                    />
                  ))}
                </div>
              </Card>
            )}

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ProductGallery
                      images={field.value || []}
                      onChange={field.onChange}
                      maxImages={8}
                      required={true}
                      description="Upload 3-8 high-quality product images - front, back, sides, and detailed shots"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <MediaUploadInput
                    id="product-video"
                    label="Product Video (Optional)"
                    value={field.value || ""}
                    onChange={field.onChange}
                    accept="video"
                    placeholder="https://... or upload from computer"
                    description="Upload a video or enter a Cloudinary video URL (max 30 seconds)"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
                data-testid="button-cancel-product"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-submit-product"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "create" ? "Create Product" : "Update Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const deleteProductMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/products/${product.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          data-testid={`button-delete-${product.id}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{product.name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteProductMutation.mutate()}
            disabled={deleteProductMutation.isPending}
            className="bg-destructive hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {deleteProductMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function SellerProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Debounce search query to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Show loading state while debouncing
  const isSearching = searchQuery !== debouncedSearchQuery;

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "seller")) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const { data: products = [], isLoading, isError, error, refetch } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated && user?.role === "seller",
    select: (data) => data.filter(p => p.sellerId === user?.id),
    retry: 2,
    retryDelay: 1000,
  });

  // Use debounced search query for filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [products, debouncedSearchQuery]);

  if (authLoading || !isAuthenticated || user?.role !== "seller") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout role="seller">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-products">My Products</h1>
            <p className="text-muted-foreground mt-1">Manage your product catalog</p>
          </div>
          <ProductFormDialog mode="create" />
        </div>

        <div className="mb-6">
          <div className="relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-products"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                Searching...
              </span>
            )}
          </div>
        </div>

        {isError ? (
          <Card className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Products</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : "An error occurred while loading your products"}
              </p>
              <Button onClick={() => refetch()} data-testid="button-retry-products">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start gap-4 animate-pulse">
                  <div className="w-24 h-24 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-muted rounded w-20" />
                      <div className="h-6 bg-muted rounded w-20" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="p-4" data-testid={`card-product-${product.id}`}>
                <div className="flex items-start gap-4">
                  {product.images[0] && (
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate" data-testid={`text-name-${product.id}`}>
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <ProductFormDialog mode="edit" product={product} />
                        <DeleteProductDialog product={product} />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => navigate(`/product/${product.id}`)}
                          data-testid={`button-view-${product.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4">
                      <div>
                        <span className="text-lg font-bold text-primary">GHS {product.price}</span>
                        {product.compareAtPrice && (
                          <span className="ml-2 text-sm line-through text-muted-foreground">
                            GHS {product.compareAtPrice}
                          </span>
                        )}
                      </div>
                      
                      <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                      </Badge>
                      
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredProducts.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-products">
                  {debouncedSearchQuery ? "No products found matching your search" : "No products yet. Add your first product to get started!"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
