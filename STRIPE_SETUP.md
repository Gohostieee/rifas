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
   - Webhook verifies the Stripe signature cryptographically (using `STRIPE_WEBHOOK_SECRET`)
   - Generates random 10-digit boleto numbers
   - Calls Convex public action to create boletos
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

1. **Deploy Convex Functions First**: 
   ```bash
   npx convex deploy
   ```
   This must be run before or during your build process to ensure all Convex functions are available.

2. **For Vercel Deployment**:
   - Add a build command: `npm run build:all` (which deploys Convex then builds Next.js)
   - OR add `npx convex deploy` as a separate build step in Vercel settings
   - OR use Vercel's "Build Command" override: `npx convex deploy && next build`

3. **Set Environment Variables**:
   - Update `NEXT_PUBLIC_BASE_URL` to your production URL (or it will auto-detect from request headers)
   - Use production Stripe keys (not test keys)
   - Ensure `STRIPE_WEBHOOK_SECRET` is set in Next.js environment variables (for webhook signature verification)
   - Note: The webhook secret is only needed in Next.js, not in Convex (Stripe signature verification is sufficient)

4. **Set up Webhook**: 
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select event: `checkout.session.completed`
   - Copy the webhook signing secret

## Troubleshooting

### Error: "Could not find public function"
If you see this error in production, ensure:
1. **Convex functions are deployed**: Run `npx convex deploy` before building
2. **Build process includes Convex deployment**: Use `npm run build:all` or add `npx convex deploy` to your build command
3. **Convex deployment completed successfully**: Check that all functions deployed without errors

### Error: "Webhook secret not configured in Convex environment"
This error has been resolved. The webhook secret is now only required in Next.js environment variables, not in Convex. The Stripe signature verification in the webhook route provides sufficient security.

### Webhook Not Working
1. Check Stripe webhook logs in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set correctly in Next.js environment variables
3. Ensure `NEXT_PUBLIC_CONVEX_URL` is set correctly
4. Check server logs for detailed error messages
5. Verify the webhook endpoint URL matches your production domain

## Important Notes

- Boleto numbers are randomly generated 10-digit numbers
- Each boleto is linked to a rifa via the `rifa` field
- The `currentBoletosSold` count is automatically updated when boletos are created
- Payment intent ID is stored with each boleto for reference
- The webhook endpoint must be publicly accessible for Stripe to send events

