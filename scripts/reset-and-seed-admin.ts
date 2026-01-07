import { db } from "../db";
import { 
  users, 
  stores, 
  products, 
  orders, 
  orderItems, 
  reviews, 
  categories, 
  heroBanners, 
  footerPages, 
  deliveryZones, 
  cart, 
  chatMessages, 
  notifications, 
  transactions, 
  adminPermissions, 
  passwordResetTokens, 
  supportConversations, 
  supportMessages, 
  deliveryAssignments, 
  mediaLibrary, 
  wishlists, 
  commissions, 
  sellerPayouts, 
  platformEarnings,
  platformSettings,
  coupons,
  bannerCollections,
  marketplaceBanners,
  riderReviews
} from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";

/**
 * Reset database and seed only the Super Admin account
 * 
 * This script:
 * 1. Clears all data from the database
 * 2. Creates ONLY the Super Admin account
 * 3. Creates default platform settings
 * 4. Creates essential delivery zones
 * 
 * Login credentials:
 * Email: superadmin@kiyumart.com
 * Password: superadmin123
 */

async function resetAndSeedAdmin() {
  console.log("🚀 Starting database reset...\n");

  try {
    // Step 1: Clear all data in correct order (respecting foreign keys)
    console.log("🧹 Clearing existing data...");
    
    // Clear dependent tables first
    const tablesToClear = [
      { name: "support_messages", table: supportMessages },
      { name: "support_conversations", table: supportConversations },
      { name: "delivery_assignments", table: deliveryAssignments },
      { name: "rider_reviews", table: riderReviews },
      { name: "seller_payouts", table: sellerPayouts },
      { name: "commissions", table: commissions },
      { name: "platform_earnings", table: platformEarnings },
      { name: "chat_messages", table: chatMessages },
      { name: "notifications", table: notifications },
      { name: "cart", table: cart },
      { name: "wishlists", table: wishlists },
      { name: "transactions", table: transactions },
      { name: "order_items", table: orderItems },
      { name: "reviews", table: reviews },
      { name: "orders", table: orders },
      { name: "products", table: products },
      { name: "coupons", table: coupons },
      { name: "stores", table: stores },
      { name: "admin_permissions", table: adminPermissions },
      { name: "password_reset_tokens", table: passwordResetTokens },
      { name: "marketplace_banners", table: marketplaceBanners },
      { name: "banner_collections", table: bannerCollections },
      { name: "categories", table: categories },
      { name: "hero_banners", table: heroBanners },
      { name: "footer_pages", table: footerPages },
      { name: "delivery_zones", table: deliveryZones },
      { name: "media_library", table: mediaLibrary },
      { name: "platform_settings", table: platformSettings },
      { name: "users", table: users },
    ];

    for (const { name, table } of tablesToClear) {
      try {
        await db.delete(table);
        console.log(`  ✓ Cleared ${name}`);
      } catch (error: any) {
        console.log(`  ⚠ Skipped ${name} (${error.message?.substring(0, 50) || 'error'})`);
      }
    }

    console.log("\n✅ Database cleared successfully!\n");

    // Step 2: Create Super Admin account
    console.log("👤 Creating Super Admin account...");
    const hashedPassword = await bcrypt.hash("superadmin123", 10);
    
    const [superAdmin] = await db.insert(users).values({
      email: "superadmin@kiyumart.com",
      password: hashedPassword,
      name: "Super Administrator",
      role: "super_admin",
      phone: "+233000000001",
      isActive: true,
      isApproved: true,
      applicationStatus: "approved",
    }).returning();

    console.log(`  ✓ Created Super Admin: ${superAdmin.email}`);

    // Step 3: Create admin permissions for super admin
    console.log("\n🔐 Setting up Super Admin permissions...");
    await db.insert(adminPermissions).values({
      userId: superAdmin.id,
      canManageUsers: true,
      canManageProducts: true,
      canManageOrders: true,
      canManageStores: true,
      canManageCategories: true,
      canManageAdmins: true,
      canEditPasswords: true,
      canManageRoles: true,
      canManagePlatformSettings: true,
      canViewAnalytics: true,
      canManagePromotions: true,
      canManageReviews: true,
      maxProductsPerDay: 1000,
      maxOrdersPerDay: 5000,
    });
    console.log("  ✓ Super Admin permissions configured");

    // Step 4: Create default platform settings
    console.log("\n⚙️ Creating default platform settings...");
    await db.insert(platformSettings).values({
      isMultiVendor: true,
      platformName: "KiyuMart",
      primaryColor: "#1e7b5f",
      secondaryColor: "#2c3e50",
      accentColor: "#e74c3c",
      lightBgColor: "#ffffff",
      lightTextColor: "#000000",
      darkBgColor: "#1a1a1a",
      darkTextColor: "#ffffff",
      lightCardColor: "#f8f9fa",
      darkCardColor: "#2a2a2a",
      defaultCurrency: "GHS",
    });
    console.log("  ✓ Platform settings created");

    // Step 5: Create essential delivery zones
    console.log("\n📍 Creating delivery zones...");
    const zones = [
      { name: "Accra Central", fee: "15.00" },
      { name: "Kumasi", fee: "25.00" },
      { name: "Takoradi", fee: "30.00" },
      { name: "Tamale", fee: "35.00" },
      { name: "Cape Coast", fee: "20.00" },
    ];

    for (const zone of zones) {
      await db.insert(deliveryZones).values({
        name: zone.name,
        fee: zone.fee,
        isActive: true,
      });
      console.log(`  ✓ Created zone: ${zone.name} (₵${zone.fee})`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ DATABASE RESET COMPLETE!");
    console.log("=".repeat(50));
    console.log("\n📝 SUPER ADMIN LOGIN CREDENTIALS:");
    console.log("   Email:    superadmin@kiyumart.com");
    console.log("   Password: superadmin123");
    console.log("   Dashboard: /admin");
    console.log("\n⚠️  Change the password after first login in production!");
    console.log("=".repeat(50) + "\n");

  } catch (error) {
    console.error("\n❌ Error during reset:", error);
    process.exit(1);
  }
}

// Run the script
resetAndSeedAdmin()
  .then(() => {
    console.log("Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
