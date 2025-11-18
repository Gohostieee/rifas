# Stripe Integration Setup Guide

## Overview
This application integrates Stripe for payment processing. When a user purchases boletos (tickets), the payment is processed through Stripe, and upon successful payment, boletos are automatically created in the database via a webhook.

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe webhook secret

# Application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # Your app URL (change for production)

# Convex (should already be set)
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

## Stripe Dashboard Setup

1. **Create a Stripe Account**: Sign up at https://stripe.com
2. **Get API Keys**: 
   - Go to Developers > API keys
   - Copy your Publishable key and Secret key
   - Add them to `.env.local`

3. **Set up Webhook**:
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   - Select events: `checkout.session.completed`
   - Copy the webhook signing secret and add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## How It Works

1. **User Flow**:
   - User selects number of tickets
   - User clicks "Proceder al Pago Seguro"
   - Form appears asking for name, email, and phone
   - User submits form, which creates a Stripe Checkout Session
   - User is redirected to Stripe Checkout
   - User completes payment

2. **Webhook Flow**:
   - Stripe sends `checkout.session.completed` event to webhook endpoint
   - Webhook verifies the signature
   - Generates random 10-digit boleto numbers
   - Calls Convex internal action to create boletos
   - Updates the rifa's `currentBoletosSold` count
   - User is redirected to success page

## Files Created/Modified

### New Files:
- `app/api/stripe/checkout/route.ts` - Creates Stripe checkout sessions
- `app/api/stripe/webhook/route.ts` - Handles Stripe webhook events
- `convex/payments.ts` - Internal action for creating boletos
- `app/success/page.tsx` - Success page after payment

### Modified Files:
- `convex/schema.ts` - Added `stripePaymentIntentId` to boletos, made `rifa` required
- `convex/admin.ts` - Added `createBoletos` internal mutation
- `app/page.tsx` - Added form and Stripe checkout integration

## Testing Locally

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Copy the webhook signing secret and add to `.env.local`
4. Use Stripe test cards: https://stripe.com/docs/testing
5. Test the checkout flow

## Production Deployment

1. Update `NEXT_PUBLIC_BASE_URL` to your production URL
2. Use production Stripe keys (not test keys)
3. Set up webhook endpoint in Stripe Dashboard pointing to your production URL
4. Ensure `STRIPE_WEBHOOK_SECRET` is set in your production environment

## Important Notes

- Boleto numbers are randomly generated 10-digit numbers
- Each boleto is linked to a rifa via the `rifa` field
- The `currentBoletosSold` count is automatically updated when boletos are created
- Payment intent ID is stored with each boleto for reference
- The webhook endpoint must be publicly accessible for Stripe to send events

