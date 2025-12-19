import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";

interface MarketplaceBanner {
  id: string;
  collectionId: string | null;
  title: string | null;
  subtitle: string | null;
  imageUrl: string;
  productRef: string | null;
  storeRef: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  displayOrder: number;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  metadata: Record<string, any>;
}

interface MarketplaceBannerCarouselProps {
  autoplayEnabled?: boolean;
  autoplayDuration?: number;
}

export default function MarketplaceBannerCarousel({
  autoplayEnabled = true,
  autoplayDuration = 5000,
}: MarketplaceBannerCarouselProps) {
  const [, navigate] = useLocation();
  const { formatPrice } = useLanguage();

  const { data: banners = [], isLoading } = useQuery<MarketplaceBanner[]>({
    queryKey: ["/api/homepage/banners"],
  });

  if (isLoading) {
    return (
      <div className="relative h-[350px] md:h-[450px] w-full bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg animate-pulse" data-testid="skeleton-banner-carousel" />
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative h-[350px] md:h-[450px] w-full bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg flex items-center justify-center" data-testid="empty-banner-carousel">
        <p className="text-muted-foreground">No active banners</p>
      </div>
    );
  }

  const plugins = autoplayEnabled
    ? [
        Autoplay({
          delay: autoplayDuration,
          stopOnInteraction: true,
        }),
      ]
    : [];

  const handleBannerClick = (banner: MarketplaceBanner) => {
    if (banner.ctaUrl) {
      navigate(banner.ctaUrl);
    } else if (banner.productRef) {
      navigate(`/product/${banner.productRef}`);
    } else if (banner.storeRef) {
      navigate(`/store/${banner.storeRef}`);
    }
  };

  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      plugins={plugins}
      className="w-full"
      data-testid="carousel-marketplace-banners"
    >
      <CarouselContent>
        {banners.map((banner) => (
          <CarouselItem key={banner.id}>
            <Card className="overflow-hidden border-0">
              <div className="relative h-[350px] md:h-[450px] w-full group">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || "Banner"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  data-testid={`img-banner-${banner.id}`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                
                <div className="absolute inset-0 flex items-center">
                  <div className="container max-w-7xl mx-auto px-4 md:px-8">
                    <div className="max-w-2xl text-white">
                      {banner.metadata?.discount && (
                        <Badge 
                          variant="destructive" 
                          className="mb-3 text-sm"
                          data-testid={`badge-discount-${banner.id}`}
                        >
                          {banner.metadata.discount}% OFF
                        </Badge>
                      )}
                      
                      {banner.title && (
                        <h1 
                          className="text-3xl md:text-5xl font-bold mb-3 drop-shadow-lg"
                          data-testid={`text-banner-title-${banner.id}`}
                        >
                          {banner.title}
                        </h1>
                      )}
                      
                      {banner.subtitle && (
                        <p 
                          className="text-base md:text-lg mb-5 text-white/90 drop-shadow-md max-w-xl"
                          data-testid={`text-banner-subtitle-${banner.id}`}
                        >
                          {banner.subtitle}
                        </p>
                      )}
                      
                      {banner.metadata?.price && (
                        <div className="mb-4">
                          <span className="text-2xl md:text-3xl font-bold">
                            {formatPrice(parseFloat(banner.metadata.price))}
                          </span>
                          {banner.metadata?.originalPrice && (
                            <span className="ml-3 text-lg line-through text-white/60">
                              {formatPrice(parseFloat(banner.metadata.originalPrice))}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {banner.ctaText && (
                        <Button
                          size="lg"
                          onClick={() => handleBannerClick(banner)}
                          className="shadow-lg hover:shadow-xl transition-shadow"
                          data-testid={`button-banner-cta-${banner.id}`}
                        >
                          {banner.ctaText}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-4" data-testid="button-carousel-prev" />
      <CarouselNext className="right-4" data-testid="button-carousel-next" />
    </Carousel>
  );
}
