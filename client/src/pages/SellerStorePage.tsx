import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Store, Package, Star, MapPin } from "lucide-react";
import type { User as BaseUser, Product } from "@shared/schema";

type Seller = BaseUser;

export default function SellerStorePage() {
  const [, params] = useRoute("/sellers/:id");
  const sellerId = params?.id;

  const { data: seller, isLoading: sellerLoading } = useQuery<Seller>({
    queryKey: ["/api/users", sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${sellerId}`);
      if (!res.ok) throw new Error("Failed to fetch seller");
      return res.json();
    },
    enabled: !!sellerId,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "seller", sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/products?sellerId=${sellerId}`);
      return res.json();
    },
    enabled: !!sellerId,
  });

  if (sellerLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background dark:bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            <Skeleton className="h-48 w-full rounded-lg mb-6" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col bg-background dark:bg-gray-900">
        <Header />
        <main className="flex-1">
          <div className="container max-w-7xl mx-auto px-4 py-16 text-center">
            <Store className="w-20 h-20 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Store Not Found</h2>
            <p className="text-muted-foreground">The store you're looking for doesn't exist.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-900">
      <Header />

      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 py-4 space-y-4">
          <div className="relative">
            {seller.storeBanner ? (
              <div className="h-32 md:h-40 rounded-lg overflow-hidden">
                <img
                  src={seller.storeBanner}
                  alt={seller.storeName || seller.name}
                  className="w-full h-full object-cover"
                  data-testid="img-store-banner"
                />
              </div>
            ) : (
              <div className="h-32 md:h-40 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Store className="w-12 h-12 text-primary/40" />
              </div>
            )}

            <div className="absolute -bottom-8 left-4">
              <Avatar className="h-16 w-16 border-4 border-background">
                <AvatarImage src={(seller as any).profilePicture || undefined} />
                <AvatarFallback className="bg-primary text-white text-lg">
                  {seller.storeName?.[0] || seller.name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="pt-10 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-foreground dark:text-white" data-testid="text-store-name">
                  {seller.storeName || seller.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                  {seller.ratings && parseFloat(seller.ratings) > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{parseFloat(seller.ratings).toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>{products.length} Products</span>
                  </div>
                  {(seller as any).city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{(seller as any).city}{(seller as any).country && `, ${(seller as any).country}`}</span>
                    </div>
                  )}
                </div>
              </div>

              <Badge variant="outline" className="text-sm" data-testid="badge-seller">
                Seller
              </Badge>
            </div>

            {(seller as any).storeBio && (
              <p className="text-sm text-muted-foreground max-w-2xl" data-testid="text-store-bio">
                {(seller as any).storeBio}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground dark:text-white" data-testid="heading-products">
                Products
              </h2>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" data-testid={`skeleton-product-${i}`} />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" data-testid="grid-products">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    costPrice={product.costPrice || undefined}
                    image={product.images[0] || ""}
                    discount={product.discount || 0}
                    rating={product.ratings || "0"}
                    reviewCount={product.totalRatings || 0}
                    inStock={(product.stock || 0) > 0}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground" data-testid="empty-products">
                <Package className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No products yet</p>
                <p className="text-sm">This store hasn't listed any products</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
