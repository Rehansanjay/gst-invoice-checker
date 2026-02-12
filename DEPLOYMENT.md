# 🚀 Deployment Guide: Two-Path Workflow

## Prerequisites Checklist

- [x] Razorpay account created
- [ ] Razorpay API keys configured
- [ ] Razorpay webhook secret configured
- [x] Supabase project created
- [ ] Database schema applied
- [x] Resend API configured
- [ ] `.env.local` updated

---

## Step 1: Configure Razorpay

### 1.1 Get API Keys
1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Copy `Key ID` and `Key Secret`
4. Update `.env.local`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
   ```

### 1.2 Configure Webhook
1. Go to **Settings** → **Webhooks**
2. Add Webhook URL: `https://yourdomain.com/api/webhook`
3. Select event: **payment.captured**
4. Copy the **Webhook Secret**
5. Update `.env.local`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
   ```

> [!WARNING]
> **NEVER expose webhook secret publicly!** This is critical for payment security.

---

## Step 2: Apply Database Schema

### 2.1 Run SQL in Supabase
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy entire contents of `supabase-schema.sql`
5. Click **Run** to execute

### 2.2 Verify Tables Created
Check that these tables exist:
- ✅ `users`
- ✅ `checks` (with new fields: `check_type`, `user_id`, `guest_email`, `auto_delete_at`)
- ✅ `payments` (with new fields: `user_id`, `payment_type`, `customer_email`)
- ✅ `credit_transactions`
- ✅ `line_items`
- ✅ `validation_results`
- ✅ `analytics`

### 2.3 Test Auto-Delete Trigger
Run this test:
```sql
-- Insert a test quick check
INSERT INTO checks (check_type, guest_email, invoice_number, status)
VALUES ('quick', 'test@example.com', 'TEST-001', 'completed');

-- Verify auto_delete_at is set to 7 days from now
SELECT id, check_type, auto_delete_at FROM checks ORDER BY created_at DESC LIMIT 1;
```

---

## Step 3: Test Workflows Locally

### 3.1 Test Quick Check Flow
```bash
# Start dev server
npm run dev

# In another terminal, test quick check
curl -X POST http://localhost:3000/api/quick-check \
  -H "Content-Type: application/json" \
  -d '{
    "guestEmail": "test@example.com",
    "invoiceData": {
      "invoiceNumber": "INV-001",
      "invoiceDate": "2026-02-11",
      "supplierGSTIN": "27AABCP1234A1Z5",
      "buyerGSTIN": "27BBDCT5678B1Z3",
      "lineItems": [{
        "lineNumber": 1,
        "description": "Test Item",
        "hsnCode": "8518",
        "quantity": 1,
        "rate": 1000,
        "taxableAmount": 1000,
        "taxRate": 18,
        "taxType": "CGST_SGST",
        "cgst": 90,
        "sgst": 90,
        "igst": 0,
        "totalAmount": 1180
      }],
      "taxableTotalAmount": 1000,
      "totalTaxAmount": 180,
      "invoiceTotalAmount": 1180
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "orderId": "order_xxxxx",
  "checkId": "uuid-here",
  "razorpayKeyId": "rzp_test_xxxxx"
}
```

### 3.2 Test Package Purchase
```bash
# First, create a test user manually in Supabase
INSERT INTO users (email, full_name) VALUES ('bulk@example.com', 'Test User');

# Then test purchase
curl -X POST http://localhost:3000/api/purchase-package \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_UUID_HERE",
    "packageType": "pack_10"
  }'
```

### 3.3 Test Webhook (Use Razorpay Test Mode)
1. Use [Razorpay Webhook Tester](https://dashboard.razorpay.com/app/webhooks)
2. Send test `payment.captured` event
3. Check logs: `console.log` should show "✅ Webhook received"

---

## Step 4: Deploy to Production

### 4.1 Update Environment Variables
```env
# Update app URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Switch to live Razorpay keys
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_LIVE_WEBHOOK_SECRET
```

### 4.2 Configure Webhook in Production
1. Update webhook URL in Razorpay Dashboard
2. Use production domain: `https://yourdomain.com/api/webhook`

### 4.3 Set Up Auto-Cleanup Cron (Optional)
```sql
-- In Supabase SQL Editor
SELECT cron.schedule(
  'cleanup-expired-checks',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT cleanup_expired_checks()'
);
```

---

## Step 5: Verification

### Quick Check Flow (Guest)
1. ✅ User fills invoice form
2. ✅ Clicks "Validate - ₹99"
3. ✅ Order created in database (status: pending)
4. ✅ Razorpay checkout opens
5. ✅ User pays
6. ✅ Webhook receives payment.captured
7. ✅ Validation runs automatically
8. ✅ Email sent to guest
9. ✅ Check deleted after 7 days

### Bulk User Flow
1. ✅ User signs up
2. ✅ Purchases package (10/50/100 credits)
3. ✅ Payment captured
4. ✅ Webhook adds credits to user account
5. ✅ User validates invoice
6. ✅ Credit deducted (balance updated)
7. ✅ Check saved to history
8. ✅ Check deleted after 90 days

---

## Troubleshooting

### Webhook Not Working
```bash
# Check webhook logs in Razorpay Dashboard
# Verify signature verification logic
# Test with: https://webhook.site
```

### Credits Not Added
```sql
-- Check payment record
SELECT * FROM payments WHERE user_id = 'USER_ID' ORDER BY created_at DESC LIMIT 1;

-- Check credit transactions
SELECT * FROM credit_transactions WHERE user_id = 'USER_ID' ORDER BY created_at DESC;
```

### Email Not Sending
```bash
# Check Resend logs: https://resend.com/logs
# Verify RESEND_API_KEY in .env.local
# Check email service logs in terminal
```

---

## Next Steps

- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Add analytics tracking
- [ ] Implement retry logic for failed webhooks
- [ ] Add unit tests for payment flows
- [ ] Configure rate limiting
- [ ] Add fraud detection
