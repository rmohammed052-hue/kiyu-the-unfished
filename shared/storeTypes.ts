import { z } from "zod";

export const STORE_TYPES = [
  "clothing",
  "electronics",
  "food_beverages",
  "beauty_cosmetics",
  "home_garden",
  "sports_fitness",
  "books_media",
  "toys_games",
  "automotive",
  "health_wellness",
] as const;

export type StoreType = typeof STORE_TYPES[number];

export interface DynamicField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect" | "number" | "date";
  placeholder?: string;
  options?: string[];
  description?: string;
  required?: boolean;
}

export const STORE_TYPE_CONFIG: Record<StoreType, {
  label: string;
  description: string;
  icon: string;
  productFields: DynamicField[];
}> = {
  clothing: {
    label: "Clothing & Fashion",
    description: "Apparel, accessories, and fashion items",
    icon: "👗",
    productFields: [
      {
        name: "sizes",
        label: "Available Sizes",
        type: "multiselect",
        options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
        description: "Select all sizes you typically offer",
        required: true,
      },
      {
        name: "colors",
        label: "Available Colors",
        type: "text",
        placeholder: "e.g., Black, White, Red, Blue",
        description: "Common colors in your inventory",
        required: true,
      },
      {
        name: "materials",
        label: "Common Materials",
        type: "text",
        placeholder: "e.g., Cotton, Polyester, Silk",
        description: "Materials you work with",
        required: false,
      },
      {
        name: "genderCategory",
        label: "Target Gender",
        type: "select",
        options: ["Men", "Women", "Unisex", "Kids"],
        description: "Primary customer demographic",
        required: true,
      },
    ],
  },
  electronics: {
    label: "Electronics & Gadgets",
    description: "Tech products, gadgets, and electronic devices",
    icon: "💻",
    productFields: [
      {
        name: "brands",
        label: "Brands You Carry",
        type: "text",
        placeholder: "e.g., Samsung, Apple, HP",
        description: "Electronics brands you sell",
        required: true,
      },
      {
        name: "warrantyPeriod",
        label: "Typical Warranty Period",
        type: "select",
        options: ["No Warranty", "3 Months", "6 Months", "1 Year", "2 Years"],
        description: "Standard warranty you offer",
        required: true,
      },
      {
        name: "productCategories",
        label: "Product Categories",
        type: "multiselect",
        options: ["Phones", "Laptops", "Tablets", "Accessories", "Audio", "Gaming", "Smart Home"],
        description: "Types of electronics you sell",
        required: true,
      },
    ],
  },
  food_beverages: {
    label: "Food & Beverages",
    description: "Food products, drinks, and consumables",
    icon: "🍔",
    productFields: [
      {
        name: "foodType",
        label: "Food Type",
        type: "multiselect",
        options: ["Fresh Produce", "Packaged Foods", "Beverages", "Snacks", "Frozen Foods", "Bakery", "Dairy"],
        description: "Types of food you sell",
        required: true,
      },
      {
        name: "certifications",
        label: "Certifications",
        type: "multiselect",
        options: ["Halal", "Organic", "FDA Approved", "Kosher", "Vegan", "Gluten-Free"],
        description: "Food certifications you have",
        required: false,
      },
      {
        name: "storageRequirements",
        label: "Storage Capabilities",
        type: "multiselect",
        options: ["Room Temperature", "Refrigerated", "Frozen"],
        description: "How you store products",
        required: true,
      },
    ],
  },
  beauty_cosmetics: {
    label: "Beauty & Cosmetics",
    description: "Skincare, makeup, and beauty products",
    icon: "💄",
    productFields: [
      {
        name: "productTypes",
        label: "Product Types",
        type: "multiselect",
        options: ["Skincare", "Makeup", "Haircare", "Fragrances", "Nail Care", "Body Care", "Men's Grooming"],
        description: "Beauty categories you offer",
        required: true,
      },
      {
        name: "brands",
        label: "Brands You Carry",
        type: "text",
        placeholder: "e.g., L'Oréal, MAC, Nivea",
        description: "Beauty brands you sell",
        required: true,
      },
      {
        name: "skinTypes",
        label: "Skin Types Catered To",
        type: "multiselect",
        options: ["All Skin Types", "Oily", "Dry", "Combination", "Sensitive", "Normal"],
        description: "Target skin types",
        required: false,
      },
    ],
  },
  home_garden: {
    label: "Home & Garden",
    description: "Home decor, furniture, and garden supplies",
    icon: "🏡",
    productFields: [
      {
        name: "productCategories",
        label: "Product Categories",
        type: "multiselect",
        options: ["Furniture", "Decor", "Kitchen", "Bedding", "Garden Tools", "Plants", "Lighting", "Storage"],
        description: "Home & garden items you sell",
        required: true,
      },
      {
        name: "materials",
        label: "Common Materials",
        type: "text",
        placeholder: "e.g., Wood, Metal, Plastic, Fabric",
        description: "Materials in your products",
        required: false,
      },
    ],
  },
  sports_fitness: {
    label: "Sports & Fitness",
    description: "Sporting goods, fitness equipment, and activewear",
    icon: "⚽",
    productFields: [
      {
        name: "categories",
        label: "Sports Categories",
        type: "multiselect",
        options: ["Fitness Equipment", "Sportswear", "Outdoor Sports", "Team Sports", "Water Sports", "Cycling", "Yoga"],
        description: "Sports categories you cover",
        required: true,
      },
      {
        name: "brands",
        label: "Brands You Carry",
        type: "text",
        placeholder: "e.g., Nike, Adidas, Puma",
        description: "Sports brands you sell",
        required: false,
      },
    ],
  },
  books_media: {
    label: "Books & Media",
    description: "Books, magazines, music, and movies",
    icon: "📚",
    productFields: [
      {
        name: "mediaTypes",
        label: "Media Types",
        type: "multiselect",
        options: ["Books", "E-Books", "Magazines", "Music CDs", "DVDs", "Audiobooks", "Comics"],
        description: "Types of media you sell",
        required: true,
      },
      {
        name: "genres",
        label: "Primary Genres",
        type: "text",
        placeholder: "e.g., Fiction, Non-Fiction, Educational",
        description: "Main genres you focus on",
        required: false,
      },
    ],
  },
  toys_games: {
    label: "Toys & Games",
    description: "Toys, games, and children's products",
    icon: "🎮",
    productFields: [
      {
        name: "ageGroups",
        label: "Age Groups",
        type: "multiselect",
        options: ["0-2 years", "3-5 years", "6-8 years", "9-12 years", "Teens", "Adults"],
        description: "Target age ranges",
        required: true,
      },
      {
        name: "categories",
        label: "Product Categories",
        type: "multiselect",
        options: ["Action Figures", "Board Games", "Educational", "Electronic Games", "Outdoor Toys", "Puzzles", "Dolls"],
        description: "Types of toys & games",
        required: true,
      },
    ],
  },
  automotive: {
    label: "Automotive",
    description: "Car parts, accessories, and automotive products",
    icon: "🚗",
    productFields: [
      {
        name: "productTypes",
        label: "Product Types",
        type: "multiselect",
        options: ["Parts & Components", "Accessories", "Tools", "Oils & Fluids", "Tires", "Electronics", "Cleaning"],
        description: "Automotive products you sell",
        required: true,
      },
      {
        name: "vehicleTypes",
        label: "Vehicle Types",
        type: "multiselect",
        options: ["Cars", "Trucks", "Motorcycles", "SUVs", "Vans"],
        description: "Vehicles you cater to",
        required: false,
      },
    ],
  },
  health_wellness: {
    label: "Health & Wellness",
    description: "Health products, supplements, and wellness items",
    icon: "⚕️",
    productFields: [
      {
        name: "productCategories",
        label: "Product Categories",
        type: "multiselect",
        options: ["Vitamins & Supplements", "Medical Devices", "First Aid", "Personal Care", "Fitness Nutrition", "Herbal Products"],
        description: "Health products you offer",
        required: true,
      },
      {
        name: "certifications",
        label: "Certifications",
        type: "multiselect",
        options: ["FDA Approved", "Organic", "GMP Certified", "Halal", "Vegan"],
        description: "Product certifications",
        required: false,
      },
    ],
  },
};

export function getStoreTypeSchema(storeType: StoreType) {
  const config = STORE_TYPE_CONFIG[storeType];
  const schemaFields: Record<string, z.ZodType> = {};
  
  config.productFields.forEach((field) => {
    if (field.type === "multiselect") {
      const arraySchema = z.array(z.string());
      schemaFields[field.name] = field.required ? arraySchema.min(1) : arraySchema.optional();
    } else if (field.type === "select") {
      const selectSchema = z.string();
      schemaFields[field.name] = field.required ? selectSchema.min(1) : selectSchema.optional();
    } else if (field.type === "number") {
      const numberSchema = z.number();
      schemaFields[field.name] = field.required ? numberSchema : numberSchema.optional();
    } else {
      const stringSchema = z.string();
      schemaFields[field.name] = field.required ? stringSchema.min(1) : stringSchema.optional();
    }
  });
  
  return z.object(schemaFields);
}

export function getStoreTypeLabel(storeType: StoreType): string {
  return STORE_TYPE_CONFIG[storeType]?.label || storeType;
}

export function getStoreTypeFields(storeType: StoreType): DynamicField[] {
  return STORE_TYPE_CONFIG[storeType]?.productFields || [];
}
