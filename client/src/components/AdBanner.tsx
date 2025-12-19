import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";

interface PlatformSettings {
  adsEnabled: boolean;
  heroBannerAdImage?: string;
  heroBannerAdUrl?: string;
  sidebarAdImage?: string;
  sidebarAdUrl?: string;
  footerAdImage?: string;
  footerAdUrl?: string;
  productPageAdImage?: string;
  productPageAdUrl?: string;
}

type AdPosition = "hero" | "sidebar" | "footer" | "product-page";

interface AdBannerProps {
  position: AdPosition;
  className?: string;
}

export default function AdBanner({ position, className = "" }: AdBannerProps) {
  const { data: settings } = useQuery<PlatformSettings>({
    queryKey: ["/api/settings"],
  });

  if (!settings?.adsEnabled) {
    return null;
  }

  const getAdData = () => {
    switch (position) {
      case "hero":
        return {
          image: settings.heroBannerAdImage,
          url: settings.heroBannerAdUrl,
        };
      case "sidebar":
        return {
          image: settings.sidebarAdImage,
          url: settings.sidebarAdUrl,
        };
      case "footer":
        return {
          image: settings.footerAdImage,
          url: settings.footerAdUrl,
        };
      case "product-page":
        return {
          image: settings.productPageAdImage,
          url: settings.productPageAdUrl,
        };
      default:
        return { image: undefined, url: undefined };
    }
  };

  const ad = getAdData();

  if (!ad.image) {
    return null;
  }

  const handleAdClick = () => {
    if (ad.url) {
      window.open(ad.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={`relative group overflow-hidden rounded-lg border bg-card ${className}`}
      data-testid={`ad-banner-${position}`}
    >
      {ad.url ? (
        <button
          onClick={handleAdClick}
          className="w-full h-full relative block transition-opacity hover:opacity-90"
          data-testid={`button-ad-${position}`}
        >
          <img
            src={ad.image}
            alt="Advertisement"
            className="w-full h-full object-cover"
            data-testid={`img-ad-${position}`}
          />
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            <span>Ad</span>
          </div>
        </button>
      ) : (
        <div className="relative">
          <img
            src={ad.image}
            alt="Advertisement"
            className="w-full h-full object-cover"
            data-testid={`img-ad-${position}`}
          />
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Ad
          </div>
        </div>
      )}
    </div>
  );
}
