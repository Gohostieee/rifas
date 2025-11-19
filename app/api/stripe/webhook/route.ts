import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Generate random 10-digit boleto numbers
function generateBoletoNumbers(count: number): number[] {
  const numbers: number[] = [];
  const min = 1000000000; // 10 digits minimum
  const max = 9999999999; // 10 digits maximum
  
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }
  
  return numbers;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const rifaId = session.metadata?.rifaId;
      const ticketCount = parseInt(session.metadata?.ticketCount || "1");
      const name = session.metadata?.name || session.customer_details?.name || "";
      const email = session.metadata?.email || session.customer_details?.email || "";
      const phone = session.metadata?.phone || session.customer_details?.phone || "";
      const paymentIntentId = typeof session.payment_intent === "string" 
        ? session.payment_intent 
        : session.payment_intent?.id || "";

      if (!rifaId || !name || !email || !phone) {
        console.error("Missing required metadata in session:", session.metadata);
        return NextResponse.json(
          { error: "Missing required metadata" },
          { status: 400 }
        );
      }

      // Generate boleto numbers
      const boletoNumbers = generateBoletoNumbers(ticketCount);

      // Create boletos in Convex
      const boletos = boletoNumbers.map((number) => ({
        number,
        name,
        email,
        phone,
        stripePaymentIntentId: paymentIntentId,
      }));

      // Call Convex public action to create boletos
      // Note: Stripe signature verification above ensures this is a legitimate webhook
      await convex.action(api.payments.createBoletosFromWebhookPublic, {
        rifaId: rifaId as any,
        boletos,
      });

      console.log(`Created ${ticketCount} boletos for rifa ${rifaId}`);
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      return NextResponse.json(
        { error: error.message || "Failed to process webhook" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

// Disable body parsing, we need the raw body for signature verification
export const runtime = "nodejs";

