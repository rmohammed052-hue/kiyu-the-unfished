# Cryptocurrency Payment Integration Guide

## Overview
This document outlines cryptocurrency payment gateway options for KiyuMart, based on market research for Ghana and Africa (2025).

## Recommended Solutions

### 🇬🇭 **Option 1: BitAfrika** (Best for Ghana Market)
- **Website**: https://bitafrika.com
- **Best For**: Local Ghana businesses wanting mobile money-to-crypto integration
- **Supported Cryptocurrencies**: 
  - Bitcoin (BTC)
  - Ethereum (ETH)
  - USDT (Tether)
  - Tron (TRX)
  - Dogecoin, Litecoin, BNB, Bitcoin Cash
- **Payment Methods**: 
  - MTN Mobile Money
  - Airtel Money
  - Bank Transfers
- **Key Features**:
  - Mobile money ↔ crypto conversion
  - USD virtual cards
  - Free transfers between BitAfrika users
  - iOS & Android apps
  - Ghana-specific compliance
- **Fees**: Competitive, transparent pricing
- **Integration**: REST API available
- **Compliance**: Awaiting Ghana licensing framework (Sept 2025)

### 🌍 **Option 2: NOWPayments** (Best for Global E-commerce)
- **Website**: https://nowpayments.io
- **Best For**: Developers needing robust API, global reach
- **Supported Cryptocurrencies**: 300+ coins and tokens
- **Fees**: 0.5% (lowest in industry)
- **Fiat Conversion**: 75+ currencies including GHS
- **Integration**: 
  - RESTful API
  - WooCommerce, Shopify plugins
  - Node.js SDK available
- **Key Features**:
  - No KYC required
  - Instant settlement
  - Webhook notifications
  - Sandbox environment
  - Auto-conversion to stablecoins (reduce volatility)
- **Settlement**: Direct to merchant wallet

### 💼 **Option 3: CoinGate** (Developer-Friendly)
- **Website**: https://developer.coingate.com
- **Best For**: Developers wanting easy integration
- **Supported Cryptocurrencies**: 70+ major coins
- **Fees**: 1%
- **Key Features**:
  - Bitcoin Lightning Network support
  - Excellent API documentation
  - Real-time exchange rates
  - Test mode / sandbox
  - Node.js, Python, PHP SDKs
- **Settlement**: Fiat or crypto options

### 🏢 **Option 4: Coinbase Commerce** (Enterprise)
- **Website**: https://commerce.coinbase.com
- **Best For**: Businesses wanting brand trust
- **Supported Cryptocurrencies**: Bitcoin, Ethereum, Litecoin, Bitcoin Cash, USDC, DAI
- **Key Features**:
  - Convert to USDC (stablecoin) for volatility protection
  - Enterprise-grade security
  - Trusted Coinbase brand
  - Easy integration
- **Settlement**: Crypto to merchant wallet
- **Fees**: No processing fees (network fees apply)

---

## Implementation Roadmap

### Phase 1: Basic Crypto Acceptance (2-3 weeks)
1. **Choose Gateway**: Start with NOWPayments (global) or BitAfrika (Ghana-focused)
2. **Get API Keys**: Sign up, complete merchant verification
3. **Backend Integration**:
   - Add crypto payment initialization endpoint
   - Implement webhook handler for payment confirmation
   - Store crypto transaction details
4. **Frontend Updates**:
   - Add "Pay with Crypto" button to checkout
   - Display supported cryptocurrencies
   - Show payment QR code or address
5. **Testing**: Use sandbox/testnet before production

### Phase 2: Mobile Money ↔ Crypto (BitAfrika Only)
1. **BitAfrika API Integration**: Allow buyers to pay with crypto, sellers to receive mobile money
2. **Auto-conversion**: Crypto payments automatically converted to GHS
3. **Settlement**: Transferred to seller's mobile money wallet

### Phase 3: Multi-Gateway Support
1. Support both local (BitAfrika) and global (NOWPayments) gateways
2. User chooses preferred cryptocurrency
3. Platform handles different gateway APIs

---

## Sample Integration Code (NOWPayments)

### Backend API Endpoint
```typescript
// server/routes.ts - Add crypto payment endpoint

app.post("/api/payments/crypto/initialize", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { orderId, cryptocurrency } = req.body;
    
    const order = await storage.getOrder(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Call NOWPayments API
    const payment = await fetch("https://api.nowpayments.io/v1/payment", {
      method: "POST",
      headers: {
        "x-api-key": process.env.NOWPAYMENTS_API_KEY!,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        price_amount: parseFloat(order.total),
        price_currency: order.currency,
        pay_currency: cryptocurrency, // btc, eth, usdt, etc.
        ipn_callback_url: `${process.env.BACKEND_URL}/webhooks/nowpayments`,
        order_id: order.id,
        order_description: `Order #${order.orderNumber}`
      })
    });

    const data = await payment.json();
    
    // Store crypto transaction
    await storage.createCryptoTransaction({
      orderId: order.id,
      paymentId: data.payment_id,
      cryptocurrency: cryptocurrency,
      amount: data.pay_amount,
      address: data.pay_address,
      status: "pending"
    });

    res.json({
      paymentAddress: data.pay_address,
      amount: data.pay_amount,
      currency: cryptocurrency,
      paymentId: data.payment_id,
      expiresAt: data.expiration_estimate_date
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook handler
app.post("/webhooks/nowpayments", async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers["x-nowpayments-sig"];
    // ... signature verification logic

    const { payment_id, payment_status, order_id } = req.body;

    if (payment_status === "finished") {
      // Payment confirmed
      await storage.updateOrder(order_id, {
        paymentStatus: "completed"
      });
      
      await storage.updateCryptoTransaction(payment_id, {
        status: "completed"
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Webhook processing failed" });
  }
});
```

### Frontend Component
```tsx
// client/src/components/CryptoPayment.tsx

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCode from "react-qr-code";
import { Copy, Bitcoin } from "lucide-react";

export default function CryptoPayment({ orderId }: { orderId: string }) {
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const initializePayment = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payments/crypto/initialize", {
        orderId,
        cryptocurrency: selectedCrypto
      });
      return res.json();
    },
    onSuccess: (data) => {
      setPaymentDetails(data);
    }
  });

  const copyAddress = () => {
    navigator.clipboard.writeText(paymentDetails.paymentAddress);
    toast({ title: "Address copied!" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bitcoin className="h-5 w-5" />
        <h3 className="font-semibold">Pay with Cryptocurrency</h3>
      </div>

      {!paymentDetails ? (
        <>
          <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
              <SelectItem value="eth">Ethereum (ETH)</SelectItem>
              <SelectItem value="usdt">USDT (Tether)</SelectItem>
              <SelectItem value="ltc">Litecoin (LTC)</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => initializePayment.mutate()} disabled={initializePayment.isPending}>
            Generate Payment Address
          </Button>
        </>
      ) : (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="text-center">
            <QRCode value={paymentDetails.paymentAddress} size={200} />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Amount to send:</p>
            <p className="text-xl font-bold">
              {paymentDetails.amount} {paymentDetails.currency.toUpperCase()}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Payment Address:</p>
            <div className="flex gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                {paymentDetails.paymentAddress}
              </code>
              <Button size="sm" variant="outline" onClick={copyAddress}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Payment will be confirmed automatically after network confirmation
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## Database Schema Updates Needed

```typescript
// shared/schema.ts - Add crypto transactions table

export const cryptoTransactions = pgTable("crypto_transactions", {
  id: varchar("id").primaryKey().$default(() => crypto.randomUUID()),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  paymentId: varchar("payment_id").notNull(), // Gateway payment ID
  cryptocurrency: varchar("cryptocurrency").notNull(), // btc, eth, usdt, etc.
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(), // Crypto amount
  address: varchar("address").notNull(), // Payment address
  status: varchar("status").notNull(), // pending, completed, failed, expired
  gateway: varchar("gateway").notNull(), // nowpayments, bitafrika, coingate, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});
```

---

## Environment Variables Required

```env
# NOWPayments
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here

# BitAfrika (if using)
BITAFRIKA_API_KEY=your_api_key_here
BITAFRIKA_API_SECRET=your_api_secret_here

# CoinGate (if using)
COINGATE_API_KEY=your_api_key_here
```

---

## Ghana Market Context (2025)

### Adoption Statistics
- **17% of adults** in Ghana use cryptocurrency (3M+ people)
- **$3 billion** in annual crypto transaction volume
- **Regulation**: Ghana plans to license crypto platforms by September 2025

### Popular Use Cases
1. **Remittances**: Sending money internationally
2. **E-commerce**: Online purchases
3. **Savings**: Hedging against Cedi volatility
4. **Investment**: Asset diversification

### Recommended Approach for KiyuMart
1. **Start with Bitcoin & USDT**: Most popular in Ghana
2. **Integrate mobile money conversion**: Via BitAfrika for local market
3. **Support global wallets**: Via NOWPayments for international customers
4. **Auto-convert to GHS**: Protect sellers from volatility

---

## Implementation Priority

### High Priority (If User Demand Exists)
- ✅ Mobile Money (MTN, Vodafone/Telecel, AirtelTigo) - **COMPLETED**
- 🔶 Bitcoin Payment (BTC)
- 🔶 USDT (Stablecoin - no volatility risk)

### Medium Priority
- Ethereum (ETH)
- Other major cryptocurrencies

### Low Priority
- Multiple gateway support
- Advanced crypto features (Lightning Network, etc.)

---

## Next Steps

**To implement cryptocurrency payments:**

1. **Assess user demand**: Survey buyers/sellers about crypto payment interest
2. **Choose gateway**: NOWPayments (global) or BitAfrika (Ghana + mobile money)
3. **Set up merchant account**: Get API keys, configure webhooks
4. **Development** (2-3 weeks):
   - Backend API endpoints
   - Frontend payment UI
   - Database schema
   - Testing
5. **Launch in test mode**: Beta test with select users
6. **Go live**: Full production launch

**Estimated Timeline**: 2-3 weeks for basic Bitcoin/USDT support

**Estimated Cost**: 
- Development: Already budgeted
- Gateway fees: 0.5-1% per transaction (lower than card fees)
- No upfront integration costs

---

## Resources

- NOWPayments API Docs: https://documenter.getpostman.com/view/7907941/S1a32n38
- BitAfrika Developer Portal: https://bitafrika.com/developers
- CoinGate API: https://developer.coingate.com/
- Ghana Crypto Regulations: Monitor Bank of Ghana announcements
