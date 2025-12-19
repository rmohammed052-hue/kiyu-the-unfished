import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFooterPageSchema } from "@shared/schema";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit, Trash2, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import type { FooterPage } from "@shared/schema";

const footerPageFormSchema = insertFooterPageSchema.extend({
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  url: z.string().optional(),
  group: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  openInNewTab: z.boolean().optional(),
});

type FooterPageFormData = z.infer<typeof footerPageFormSchema>;

export default function AdminFooterPagesManager() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<FooterPage | null>(null);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: pages = [], isLoading } = useQuery<FooterPage[]>({
    queryKey: ["/api/admin/footer-pages"],
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin"))) {
      navigate("/auth");
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const form = useForm<FooterPageFormData>({
    resolver: zodResolver(footerPageFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      url: "",
      group: "general",
      displayOrder: 0,
      isActive: true,
      openInNewTab: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FooterPageFormData) => {
      const response = await apiRequest("POST", "/api/admin/footer-pages", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/footer-pages"] });
      setIsDialogOpen(false);
      setEditingPage(null);
      form.reset();
      toast({ title: "Success", description: "Footer page created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FooterPageFormData }) => {
      const response = await apiRequest("PATCH", `/api/admin/footer-pages/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/footer-pages"] });
      setIsDialogOpen(false);
      setEditingPage(null);
      form.reset();
      toast({ title: "Success", description: "Footer page updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/footer-pages/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/footer-pages"] });
      toast({ title: "Success", description: "Footer page deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/footer-pages/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/footer-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/footer-pages"] });
      toast({ title: "Success", description: "Page visibility updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = (page: FooterPage) => {
    setEditingPage(page);
    form.reset({
      title: page.title,
      slug: page.slug,
      content: page.content || "",
      url: page.url || "",
      group: page.group || "general",
      displayOrder: page.displayOrder || 0,
      isActive: page.isActive ?? true,
      openInNewTab: page.openInNewTab ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this page? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleVisibility = (id: string, currentStatus: boolean | null) => {
    toggleVisibilityMutation.mutate({ id, isActive: !currentStatus });
  };

  const onSubmit = (data: FooterPageFormData) => {
    if (editingPage) {
      updateMutation.mutate({ id: editingPage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenDialog = () => {
    setEditingPage(null);
    form.reset({
      title: "",
      slug: "",
      content: "",
      url: "",
      group: "general",
      displayOrder: pages.length,
      isActive: true,
      openInNewTab: false,
    });
    setIsDialogOpen(true);
  };

  const handleTitleChange = (title: string) => {
    if (!editingPage) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      form.setValue("slug", slug);
    }
  };

  if (authLoading || isLoading || !isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Footer Pages Manager</h1>
        </div>

        <div className="mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog} data-testid="button-add-page">
                <Plus className="mr-2 h-4 w-4" />
                Add New Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPage ? "Edit Page" : "Create New Page"}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              handleTitleChange(e.target.value);
                            }}
                            placeholder="e.g., Returns & Refunds"
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug (URL)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., returns-refunds"
                            data-testid="input-slug"
                          />
                        </FormControl>
                        {editingPage && (
                          <p className="text-xs text-muted-foreground">
                            Changing the slug will update the page URL. Existing links may break.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (HTML supported)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={10}
                            placeholder="Enter page content here (HTML supported)..."
                            data-testid="textarea-content"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="group"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="e.g., customer_service, general"
                            data-testid="input-group"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="displayOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Order</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-display-order"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-end">
                          <FormLabel>Visible in Footer</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-is-active"
                              />
                              <span className="text-sm">{field.value ? "Visible" : "Hidden"}</span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                      {(createMutation.isPending || updateMutation.isPending) ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        editingPage ? "Update Page" : "Create Page"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {pages.map((page) => (
            <Card key={page.id} data-testid={`card-page-${page.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span data-testid={`text-page-title-${page.id}`}>{page.title}</span>
                    {page.isActive ? (
                      <Badge variant="default" className="ml-2" data-testid={`badge-visible-${page.id}`}>Visible</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2" data-testid={`badge-hidden-${page.id}`}>Hidden</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1" data-testid={`text-page-info-${page.id}`}>
                    /page/{page.slug} | Group: {page.group || "general"} | Order: {page.displayOrder}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleVisibility(page.id, page.isActive)}
                    data-testid={`button-toggle-visibility-${page.id}`}
                  >
                    {page.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(page)}
                    data-testid={`button-edit-${page.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(page.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${page.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {page.content && (
                <CardContent>
                  <div className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-page-content-${page.id}`}>
                    {page.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
          {pages.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground" data-testid="text-empty-state">
                No footer pages yet. Click "Add New Page" to create one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
