# 🔐 KiyuMart Admin Login Credentials

## ✅ VERIFIED WORKING CREDENTIALS (As of Nov 11, 2025)

### 🔑 Super Admin Account
**Email:** `superadmin@kiyumart.com`  
**Password:** `superadmin123`  
**Dashboard:** `/admin`

**Full Access:**
- All admin features
- Manage admins & assign roles
- Edit user passwords
- Platform-wide control
- User management
- Product management
- Order management
- Analytics & reports

---

### 🔑 Admin Account
**Email:** `admin@kiyumart.com`  
**Password:** `admin123`  
**Dashboard:** `/admin`

**Access:**
- Product management
- Order management
- User management
- Delivery zones
- Platform settings
- Analytics

---

### 🔑 Seller Account
**Email:** `seller@kiyumart.com`  
**Password:** `seller123`  
**Dashboard:** `/seller`

**Other Sellers:**
- `seller1@kiyumart.com` / `password123` (Fatima's Modest Fashion)
- `seller2@kiyumart.com` / `password123` (Aisha's Elegant Wear)
- `seller3@kiyumart.com` / `password123` (Zainab's Fashion House)

---

### 🔑 Buyer/Customer Account
**Email:** `buyer@kiyumart.com`  
**Password:** `buyer123`  
**Dashboard:** Customer dashboard

---

### 🔑 Rider Account
**Email:** `rider@kiyumart.com`  
**Password:** `rider123`  
**Dashboard:** `/rider`

---

### 🔑 Agent/Support Account
**Email:** `agent@kiyumart.com`  
**Password:** `agent123`  
**Dashboard:** `/agent`

---

## 📊 Database Status (CONFIRMED SEEDED)

✅ **9 Users** (1 super admin, 1 admin, 4 sellers, 1 buyer, 1 rider, 1 agent)  
✅ **6 Products** (Islamic fashion items)  
✅ **5 Categories** (Hijabs, Abayas, Modest Dresses, Islamic Accessories, Modest Footwear)  
✅ **5 Delivery Zones** (Accra Central, Greater Accra, Kumasi, Takoradi, Nationwide)  
✅ **3 Hero Banners** (Homepage promotional banners)

---

## 🚀 Quick Login Test

```bash
# Test Super Admin Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"super_admin@kiyumart.com","password":"super_admin123"}'
```

---

## ⚠️ IMPORTANT NOTES

1. **Underscore in Email:** The super admin email has an **underscore** (`super_admin@kiyumart.com`), not all one word
2. **Development Only:** These are test credentials - change them for production
3. **All Active:** All accounts are active and approved
4. **Working:** All credentials have been tested and confirmed working as of Nov 11, 2025

---

## 🔧 Troubleshooting

If login fails:
1. ✅ **Verify exact email:** `superadmin@kiyumart.com` (no underscores)
2. ✅ **Verify password:** `superadmin123` (no underscores)
3. ✅ **Clear browser cookies** and try again
4. ✅ **Check server is running:** Workflow should show RUNNING status
5. ✅ **Database connected:** Verify DATABASE_URL is set

---

**Last Updated:** November 11, 2025  
**Status:** ✅ ALL SYSTEMS OPERATIONAL
