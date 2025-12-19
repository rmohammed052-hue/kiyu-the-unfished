/**
 * Seed Media Library
 * 
 * Centralized media bundles for database seeding.
 * Each bundle contains exactly 5 images + 1 video to comply with product validation.
 * Organized by store type for realistic marketplace data.
 */

export interface MediaBundle {
  images: [string, string, string, string, string]; // Exactly 5 images
  video: string;
  videoDuration: number; // in seconds
}

export interface StoreTheme {
  storeType: "clothing" | "electronics" | "food_beverages" | "beauty_cosmetics" | "home_garden" | "sports_fitness" | "books_media" | "toys_games" | "automotive" | "health_wellness";
  storeName: string;
  storeDescription: string;
  storeBanner: string;
  productBundles: {
    name: string;
    description: string;
    category: string;
    price: string;
    costPrice: string;
    stock: number;
    discount: number;
    media: MediaBundle;
  }[];
}

// Sample video URL (public domain, 10 seconds)
const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// Alternative short video samples
const VIDEO_SAMPLES = [
  "https://www.w3schools.com/html/mov_bbb.mp4", // 10s sample
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
];

export const storeThemes: StoreTheme[] = [
  {
    storeType: "clothing",
    storeName: "Modest Elegance - Islamic Fashion",
    storeDescription: "Premium Islamic women's fashion with modern designs and traditional values",
    storeBanner: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200",
    productBundles: [
      {
        name: "Elegant Black Abaya with Gold Embroidery",
        description: "Stunning black abaya featuring intricate gold embroidery along the hem and cuffs. Made from premium polyester blend for comfort and durability. Perfect for special occasions and everyday elegance.",
        category: "abayas",
        price: "189.99",
        costPrice: "95.00",
        stock: 25,
        discount: 15,
        media: {
          images: [
            "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800",
            "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
            "https://images.unsplash.com/photo-1550639524-72e1a2f61eb7?w=800",
            "https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?w=800",
          ],
          video: VIDEO_SAMPLES[0],
          videoDuration: 10,
        },
      },
      {
        name: "Luxury Silk Hijab Collection - Navy Blue",
        description: "Premium silk hijab in rich navy blue. Soft, breathable, and beautifully drapes. Measures 180cm x 70cm. Perfect for any occasion.",
        category: "hijabs",
        price: "45.99",
        costPrice: "20.00",
        stock: 50,
        discount: 10,
        media: {
          images: [
            "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800",
            "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800",
            "https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?w=800",
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
            "https://images.unsplash.com/photo-1550639524-72e1a2f61eb7?w=800",
          ],
          video: VIDEO_SAMPLES[1],
          videoDuration: 8,
        },
      },
      {
        name: "Modern Modest Maxi Dress - Burgundy",
        description: "Beautiful burgundy maxi dress with modest cut. Features long sleeves, high neck, and flowing skirt. Perfect for formal events and casual wear.",
        category: "dresses",
        price: "129.99",
        costPrice: "65.00",
        stock: 30,
        discount: 20,
        media: {
          images: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800",
            "https://images.unsplash.com/photo-1550639524-72e1a2f61eb7?w=800",
            "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800",
            "https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?w=800",
            "https://images.unsplash.com/photo-1591085686350-798c0f9faa7f?w=800",
          ],
          video: VIDEO_SAMPLES[2],
          videoDuration: 12,
        },
      },
    ],
  },
  {
    storeType: "electronics",
    storeName: "TechHub - Electronics & Gadgets",
    storeDescription: "Latest electronics, smartphones, laptops, and accessories at competitive prices",
    storeBanner: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200",
    productBundles: [
      {
        name: "Wireless Bluetooth Headphones - Premium Sound",
        description: "High-quality wireless headphones with active noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals.",
        category: "electronics",
        price: "149.99",
        costPrice: "75.00",
        stock: 45,
        discount: 25,
        media: {
          images: [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800",
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800",
            "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800",
            "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=800",
          ],
          video: VIDEO_SAMPLES[0],
          videoDuration: 10,
        },
      },
    ],
  },
  {
    storeType: "beauty_cosmetics",
    storeName: "Radiant Beauty - Cosmetics & Skincare",
    storeDescription: "Premium beauty products, skincare, and cosmetics for the modern woman",
    storeBanner: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200",
    productBundles: [
      {
        name: "Organic Skincare Set - Complete Routine",
        description: "Complete skincare routine with organic ingredients. Includes cleanser, toner, serum, and moisturizer. Suitable for all skin types.",
        category: "skincare",
        price: "89.99",
        costPrice: "40.00",
        stock: 60,
        discount: 15,
        media: {
          images: [
            "https://images.unsplash.com/photo-1556228578-dd4c90d354d8?w=800",
            "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800",
            "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800",
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800",
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800",
          ],
          video: VIDEO_SAMPLES[1],
          videoDuration: 8,
        },
      },
    ],
  },
  {
    storeType: "home_garden",
    storeName: "HomeStyle - Furniture & Decor",
    storeDescription: "Beautiful furniture and home decor to make your house a home",
    storeBanner: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200",
    productBundles: [
      {
        name: "Modern Table Lamp - Brass Finish",
        description: "Elegant modern table lamp with brass finish. Adjustable arm and dimmer function. Perfect for reading nooks and bedside tables.",
        category: "home_decor",
        price: "79.99",
        costPrice: "35.00",
        stock: 40,
        discount: 10,
        media: {
          images: [
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800",
            "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800",
            "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800",
            "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800",
            "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800",
          ],
          video: VIDEO_SAMPLES[2],
          videoDuration: 12,
        },
      },
    ],
  },
  {
    storeType: "books_media",
    storeName: "BookHaven - Books & Media",
    storeDescription: "Curated collection of books, magazines, and educational materials",
    storeBanner: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200",
    productBundles: [
      {
        name: "Islamic Literature Collection - 5 Books",
        description: "Curated collection of 5 essential Islamic literature books covering various topics from spirituality to history. Perfect for personal library.",
        category: "books",
        price: "59.99",
        costPrice: "25.00",
        stock: 35,
        discount: 20,
        media: {
          images: [
            "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800",
            "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800",
            "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800",
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800",
          ],
          video: VIDEO_SAMPLES[0],
          videoDuration: 10,
        },
      },
    ],
  },
];

/**
 * Get a themed product bundle for seeding
 */
export function getProductBundle(storeType: string, index: number = 0) {
  const theme = storeThemes.find(t => t.storeType === storeType);
  if (!theme) {
    throw new Error(`No theme found for store type: ${storeType}`);
  }
  const bundle = theme.productBundles[index % theme.productBundles.length];
  return bundle;
}

/**
 * Get all product bundles for a store type
 */
export function getAllProductBundles(storeType: string) {
  const theme = storeThemes.find(t => t.storeType === storeType);
  if (!theme) {
    throw new Error(`No theme found for store type: ${storeType}`);
  }
  return theme.productBundles;
}

/**
 * Get store theme information
 */
export function getStoreTheme(storeType: string) {
  const theme = storeThemes.find(t => t.storeType === storeType);
  if (!theme) {
    throw new Error(`No theme found for store type: ${storeType}`);
  }
  return theme;
}

/**
 * Create a compliant product from a bundle
 * Ensures all products have exactly 5 images + 1 video
 */
export function createCompliantProductData(
  sellerId: string,
  storeType: string,
  bundleIndex: number = 0,
  storeId?: string | null
) {
  const bundle = getProductBundle(storeType, bundleIndex);
  
  return {
    sellerId,
    storeId: storeId || undefined,
    name: bundle.name,
    description: bundle.description,
    category: bundle.category,
    price: bundle.price,
    costPrice: bundle.costPrice,
    stock: bundle.stock,
    discount: bundle.discount,
    images: bundle.media.images,
    video: bundle.media.video,
    videoDuration: bundle.media.videoDuration,
  };
}
