import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SellerCategoryCard from "@/components/SellerCategoryCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Store } from "lucide-react";
import type { User as BaseUser, Product } from "@shared/schema";

type Seller = BaseUser;

export default function BrowseStores() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sellers = [], isLoading: sellersLoading } = useQuery<Seller[]>({
    queryKey: ["/api/homepage/sellers"],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const getSellerProductCount = (sellerId: string) => {
    return allProducts.filter((p) => p.sellerId === sellerId).length;
  };

  const filteredSellers = sellers.filter((seller) =>
    seller.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-gray-900">
      <Header />

      <main className="flex-1">
        <div className="container max-w-7xl mx-auto px-4 py-6 space-y-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Store className="w-6 h-6 text-primary" />
                <h1 className="text-3xl font-bold text-foreground dark:text-white" data-testid="heading-browse-stores">
                  Browse Stores
                </h1>
              </div>
              <Badge variant="outline" className="text-sm" data-testid="badge-store-count">
                {filteredSellers.length} {filteredSellers.length === 1 ? "Store" : "Stores"}
              </Badge>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>

          {sellersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-lg" data-testid={`skeleton-store-${i}`} />
              ))}
            </div>
          ) : filteredSellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="grid-stores">
              {filteredSellers.map((seller) => (
                <SellerCategoryCard
                  key={seller.id}
                  seller={seller}
                  productCount={getSellerProductCount(seller.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground" data-testid="empty-stores">
              <Store className="w-20 h-20 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No stores found</p>
              <p className="text-sm">Try adjusting your search</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
