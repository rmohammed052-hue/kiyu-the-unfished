import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Store, Package } from "lucide-react";
import type { User } from "@shared/schema";

interface SellerCategoryCardProps {
  seller: User;
  productCount?: number;
}

export default function SellerCategoryCard({ seller, productCount = 0 }: SellerCategoryCardProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    navigate(`/sellers/${seller.id}`);
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
      onClick={handleClick}
      data-testid={`card-seller-${seller.id}`}
    >
      <div className="relative aspect-[4/3]">
        {seller.storeBanner ? (
          <img
            src={seller.storeBanner}
            alt={seller.storeName || seller.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            data-testid={`img-seller-banner-${seller.id}`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Store className="w-12 h-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="absolute left-3 bottom-3 right-3">
          <h3 
            className="text-white font-semibold text-lg mb-1 drop-shadow-lg line-clamp-1"
            data-testid={`text-seller-name-${seller.id}`}
          >
            {seller.storeName || seller.name}
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-white/90 text-sm">
              <Package className="w-3.5 h-3.5" />
              <span data-testid={`text-product-count-${seller.id}`}>
                {productCount} {productCount === 1 ? "product" : "products"}
              </span>
            </div>
            
            {seller.ratings && parseFloat(seller.ratings) > 0 && (
              <Badge 
                variant="secondary" 
                className="bg-white/90 text-black text-xs"
                data-testid={`badge-rating-${seller.id}`}
              >
                ⭐ {parseFloat(seller.ratings).toFixed(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
