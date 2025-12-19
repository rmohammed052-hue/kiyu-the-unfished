import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { ShoppingBag, Package } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}

interface CategoryCardProps {
  id?: string;
  name: string;
  image: string;
  slug?: string;
  category?: Category;
  productCount?: number;
  onClick?: (id: string) => void;
}

export default function CategoryCard({
  id,
  name,
  image,
  slug,
  category,
  productCount,
  onClick,
}: CategoryCardProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    if (onClick && id) {
      onClick(id);
    } else if (category) {
      navigate(`/category/${category.slug}`);
    } else if (slug) {
      navigate(`/category/${slug}`);
    } else if (id) {
      navigate(`/category/${id}`);
    }
  };

  return (
    <Card
      className="group overflow-hidden cursor-pointer hover-elevate active-elevate-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
      onClick={handleClick}
      data-testid={`card-category-${id || category?.id}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-primary/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="text-lg font-semibold mb-1 drop-shadow-lg" data-testid={`text-category-name-${id || category?.id}`}>
            {name}
          </h3>
          {productCount !== undefined && productCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-white/90">
              <Package className="w-3.5 h-3.5" />
              <span data-testid={`text-product-count-${id || category?.id}`}>
                {productCount} {productCount === 1 ? "item" : "items"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
