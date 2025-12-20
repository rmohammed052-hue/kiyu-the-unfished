# KiyuMart API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication

All authenticated endpoints require a JWT token sent via:
1. **Cookie** (recommended): `token` cookie (httpOnly, secure in production)
2. **Header**: `Authorization: Bearer <token>`

### CSRF Protection
State-changing requests (POST, PUT, PATCH, DELETE) require CSRF token:
- **Cookie**: `csrf-token` (set automatically on GET requests)
- **Header**: `X-CSRF-Token: <token-from-cookie>`

## Health & Monitoring

### GET /health
**Comprehensive health check with database connectivity**
- **Auth**: None
- **Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T12:00:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "database": "connected",
    "memory": {
      "used": 150,
      "total": 512
    }
  }
}
```
- **Status Codes**: 200 (healthy), 207 (degraded), 503 (unhealthy)

### GET /health/live
**Kubernetes liveness probe**
- **Auth**: None
- **Response**: `{ "status": "alive" }`
- **Status Codes**: 200 (alive), 503 (dead)

### GET /health/ready
**Kubernetes readiness probe**
- **Auth**: None
- **Response**: `{ "status": "ready" }`
- **Status Codes**: 200 (ready), 503 (not ready)

## Authentication Endpoints

### POST /api/auth/signup
**Register new user account**
- **Auth**: None
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+233501234567",
  "role": "buyer"
}
```
- **Password Requirements**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Roles**: `buyer` (default), `seller`, `rider`, `agent`
- **Response**:
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer",
    "isActive": true,
    "isApproved": true
  }
}
```
- **Note**: Sellers and riders require admin approval (`isApproved: false`)

### POST /api/auth/login
**Authenticate user**
- **Auth**: None
- **Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```
- **Response**:
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer"
  }
}
```
- **Sets Cookie**: `token` (httpOnly, 7 days expiry)

### POST /api/auth/logout
**End user session**
- **Auth**: Optional
- **Response**: `{ "success": true }`
- **Clears Cookie**: `token`

### GET /api/auth/me
**Get current authenticated user**
- **Auth**: Required
- **Response**:
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "buyer",
  "profileImage": null,
  "phone": "+233501234567",
  "isActive": true,
  "isApproved": true
}
```

### POST /api/auth/change-password
**Change user password**
- **Auth**: Required
- **Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```
- **Password Requirements**: Same as signup
- **Response**: `{ "success": true, "message": "Password changed successfully" }`

## User Management (Admin Only)

### GET /api/users
**List all users with filters**
- **Auth**: Required (admin, super_admin)
- **Query Parameters**:
  - `role`: Filter by role (buyer, seller, rider, admin, agent, super_admin)
  - `isActive`: Filter by active status (true/false)
  - `isApproved`: Filter by approval status (true/false)
  - `applicationStatus`: Filter by application status (pending, approved, rejected)
- **Response**:
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "buyer",
    "isActive": true,
    "isApproved": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### GET /api/users/:id
**Get specific user details**
- **Auth**: Required (admin, super_admin)
- **Response**: User object (same as /api/auth/me)

### POST /api/users
**Create new user (admin)**
- **Auth**: Required (admin, super_admin)
- **Request Body**:
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "role": "seller",
  "phone": "+233501234568",
  "storeType": "clothing",
  "storeName": "Jane's Fashion",
  "storeDescription": "Modern Islamic fashion"
}
```
- **Response**: Created user object
- **Note**: Admin-created users are auto-approved

### PATCH /api/users/:id
**Update user details**
- **Auth**: Required (admin, super_admin)
- **Allowed Fields**: name, email, phone, role, isActive, isApproved, vehicleInfo, storeType, storeName, storeDescription, storeBanner
- **Request Body** (partial):
```json
{
  "isActive": false,
  "isApproved": true
}
```
- **Response**: Updated user object
- **Note**: Only super_admin can assign super_admin role

### DELETE /api/users/:id
**Hard delete user and all related data**
- **Auth**: Required (admin, super_admin)
- **Response**: `{ "success": true, "message": "User and all related data deleted successfully" }`
- **Deletes**: User, products, stores, orders, cart, wishlist, messages, notifications, reviews

### PATCH /api/users/:id/approve
**Approve pending seller/rider application**
- **Auth**: Required (admin, super_admin)
- **Response**: Updated user object with `isApproved: true`
- **Creates**: Store for approved sellers

### PATCH /api/users/:id/reject
**Reject pending seller/rider application**
- **Auth**: Required (admin, super_admin)
- **Request Body** (optional):
```json
{
  "reason": "Incomplete documentation"
}
```
- **Response**: Updated user object with `applicationStatus: "rejected"`
- **Sends**: Notification to user with rejection reason

### PATCH /api/users/:id/status
**Toggle user active status**
- **Auth**: Required (admin, super_admin)
- **Request Body**:
```json
{
  "isActive": false
}
```
- **Response**: Updated user object

## Application Routes (Public)

### POST /api/applications/seller
**Apply to become a seller**
- **Auth**: None
- **Request Body**:
```json
{
  "name": "Seller Name",
  "email": "seller@example.com",
  "password": "SecurePass123!",
  "phone": "+233501234567",
  "storeType": "clothing",
  "storeName": "My Fashion Store",
  "storeDescription": "Islamic fashion boutique",
  "storeTypeMetadata": {
    "primaryCategories": ["abayas", "hijabs"]
  }
}
```
- **Store Types**: clothing, electronics, food_beverages, beauty_cosmetics, home_garden, sports_fitness, books_media, toys_games, automotive, health_wellness
- **Response**: Created user object with `isApproved: false`
- **Notification**: Admins notified of new application

### POST /api/applications/rider
**Apply to become a delivery rider**
- **Auth**: None
- **Request Body**:
```json
{
  "name": "Rider Name",
  "email": "rider@example.com",
  "password": "SecurePass123!",
  "phone": "+233501234567",
  "vehicleInfo": {
    "type": "motorcycle",
    "plateNumber": "GH-123-AB",
    "license": "LIC-12345",
    "color": "Black"
  }
}
```
- **Vehicle Types**: motorcycle, bicycle, car
- **Required Fields by Type**:
  - **Motorcycle**: plateNumber, license
  - **Car**: plateNumber, license, color
  - **Bicycle**: None (optional fields only)
- **Response**: Created user object with `isApproved: false`
- **Notification**: Admins notified of new application

## Product Management

### GET /api/products
**List all products with filters**
- **Auth**: Optional
- **Query Parameters**:
  - `category`: Filter by category
  - `sellerId`: Filter by seller
  - `search`: Search by name/description
  - `minPrice`: Minimum price
  - `maxPrice`: Maximum price
  - `isActive`: Filter by active status
- **Response**:
```json
[
  {
    "id": "uuid",
    "name": "Premium Abaya",
    "description": "Elegant black abaya",
    "price": 150.00,
    "category": "Abayas",
    "sellerId": "uuid",
    "images": ["url1", "url2"],
    "video": "url",
    "isActive": true,
    "ratings": "4.5",
    "totalReviews": 10
  }
]
```

### GET /api/products/:id
**Get product details**
- **Auth**: Optional
- **Response**: Full product object with seller details and reviews

### POST /api/products
**Create new product**
- **Auth**: Required (admin, seller)
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `name`: Product name (required)
  - `description`: Product description (required)
  - `price`: Price in GHS (required)
  - `category`: Category name (required)
  - `images`: Up to 5 image files (required, max 5MB each)
  - `video`: 1 video file (optional, max 50MB)
  - `quantity`: Stock quantity (required)
  - `variants`: JSON string of variants (optional)
- **Response**: Created product object
- **Upload**: Images/videos uploaded to Cloudinary with 4K enhancement

### PATCH /api/products/:id
**Update product**
- **Auth**: Required (admin, seller - own products only)
- **Content-Type**: `multipart/form-data`
- **Fields**: Same as POST (all optional)
- **Response**: Updated product object

### DELETE /api/products/:id
**Delete product**
- **Auth**: Required (admin, seller - own products only)
- **Response**: `{ "success": true }`

## Order Management

### POST /api/orders
**Create new order**
- **Auth**: Required (buyer)
- **Request Body**:
```json
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "variant": "Large"
    }
  ],
  "deliveryAddress": "123 Main St, Accra, Ghana",
  "deliveryZoneId": "uuid",
  "paymentMethod": "paystack"
}
```
- **Response**: Created order object with payment URL

### GET /api/orders
**List orders**
- **Auth**: Required
- **Filters by role**:
  - **Buyer**: Own orders only
  - **Seller**: Orders containing their products
  - **Rider**: Assigned deliveries
  - **Admin**: All orders
- **Response**: Array of order objects

### PATCH /api/orders/:id/status
**Update order status**
- **Auth**: Required (admin, seller, rider)
- **Request Body**:
```json
{
  "status": "processing",
  "riderId": "uuid"
}
```
- **Statuses**: pending, processing, shipped, delivering, delivered, cancelled
- **Response**: Updated order object
- **Notification**: Buyer notified of status change

## Rate Limiting

### Global API Limits (per IP per 15 minutes)
- **Super Admin**: 1000 requests
- **Admin**: 1000 requests
- **Seller/Rider**: 500 requests
- **Agent**: 300 requests
- **Buyer/Anonymous**: 100 requests

### Auth Endpoint Limits (per IP per 15 minutes)
- **Login/Register**: 5 attempts

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "details": ["Additional detail 1", "Additional detail 2"]
}
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

## Security Features

### Password Security
- Bcrypt hashing with salt rounds: 10
- Strength validation:
  - Minimum 8 characters
  - Uppercase + lowercase letters
  - Numbers + special characters
  - No common patterns (password, 123456, qwerty)

### Input Sanitization
- All user inputs sanitized using DOMPurify
- HTML tags stripped from plain text fields
- Email validation and normalization
- SQL injection prevention
- XSS attack prevention

### CSRF Protection
- Double-submit cookie pattern
- Token required for state-changing requests
- Constant-time comparison to prevent timing attacks

### Environment Variables Required
```env
DATABASE_URL=postgresql://...          # Postgres connection string
JWT_SECRET=<32+ character secret>     # JWT signing secret
SESSION_SECRET=<32+ character secret> # Session encryption secret
NODE_ENV=production|development       # Environment mode
PORT=5000                             # Server port
CLOUDINARY_URL=cloudinary://...       # Cloudinary upload credentials
PAYSTACK_SECRET_KEY=sk_...           # Paystack payment key
```

## WebSocket Events

### Connection
```javascript
// Client connects with JWT token
const socket = io('http://localhost:5000', {
  auth: { token: 'jwt-token-here' }
});
```

### Events
- **`order:status`**: Order status updates
- **`message:new`**: New chat message
- **`notification:new`**: New notification

## Development & Testing

### Test Users (Development Only)
```
POST /api/seed/test-users
```
Creates test accounts for all roles:
- **Super Admin**: superadmin@kiyumart.com / superadmin123
- **Admin**: admin@kiyumart.com / admin123
- **Seller**: seller@kiyumart.com / seller123
- **Buyer**: buyer@kiyumart.com / buyer123
- **Rider**: rider@kiyumart.com / rider123
- **Agent**: agent@kiyumart.com / agent123

## Support

For API issues or questions, contact:
- **Email**: support@kiyumart.com
- **GitHub**: https://github.com/rmohammed052-hue/kiyu-the-unfished

---
**Version**: 1.0.0  
**Last Updated**: 2024-01-20  
**Maintained By**: KiyuMart Development Team
