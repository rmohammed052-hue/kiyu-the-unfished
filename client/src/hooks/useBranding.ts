import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface PlatformSettings {
  id: string;
  primaryColor: string;
  platformName: string;
  [key: string]: any;
}

// Convert hex color to HSL format for CSS variables
function hexToHSL(hex: string): string {
  // Remove the hash if it exists
  hex = hex.replace(/^#/, '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lightness = Math.round(l * 100);
  
  return `${h} ${s}% ${lightness}%`;
}

export function useBranding() {
  const { data: settings } = useQuery<PlatformSettings>({
    queryKey: ["/api/platform-settings"],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
  
  useEffect(() => {
    if (!settings) return;
    
    const root = document.documentElement;
    
    // Apply all branding colors to CSS variables
    if (settings.primaryColor) {
      const hslColor = hexToHSL(settings.primaryColor);
      root.style.setProperty('--primary', hslColor);
      root.style.setProperty('--ring', hslColor);
      root.style.setProperty('--sidebar-primary', hslColor);
      root.style.setProperty('--sidebar-ring', hslColor);
      root.style.setProperty('--chart-1', hslColor);
    }
    
    // Apply secondary and accent colors if available
    if (settings.secondaryColor) {
      root.style.setProperty('--secondary', hexToHSL(settings.secondaryColor));
    }
    
    if (settings.accentColor) {
      root.style.setProperty('--accent', hexToHSL(settings.accentColor));
      root.style.setProperty('--destructive', hexToHSL(settings.accentColor));
    }
  }, [settings]);
  
  return settings;
}
