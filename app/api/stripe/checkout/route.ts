import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
  try {
    console.log("Stripe checkout request received");
    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { rifaId, ticketCount, name, email, phone, precio } = body;

    if (!rifaId || !ticketCount || !name || !email || !phone || !precio) {
      console.error("Missing required fields in request:", { rifaId, ticketCount, name, email, phone, precio });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get base URL from environment variable or derive from request
    const getBaseUrl = () => {
      if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
      }
      // Fallback to request origin (works in production)
      const origin = request.headers.get("origin") || request.headers.get("host");
      if (origin) {
        // If origin includes protocol, use it; otherwise construct from host
        if (origin.startsWith("http")) {
          return origin;
        }
        // Determine protocol based on environment
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        return `${protocol}://${origin}`;
      }
      // Last resort fallback (shouldn't happen in production)
      return "http://localhost:3000";
    };

    const baseUrl = getBaseUrl();
    console.log("Using base URL:", baseUrl);

    // Create Stripe Checkout Session
    console.log("Creating Stripe checkout session...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "dop", // Dominican Peso
            product_data: {
              name: `Boletos para Rifa`,
              description: `${ticketCount} boleto${ticketCount > 1 ? "s" : ""}`,
            },
            unit_amount: Math.round(precio * 100), // Convert to cents
          },
          quantity: ticketCount,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#ticket-purchase`,
      customer_email: email,
      metadata: {
        rifaId,
        ticketCount: ticketCount.toString(),
        name,
        email,
        phone,
      },
      phone_number_collection: {
        enabled: true,
      },
    });
    
    console.log("Stripe checkout session created:", session.id);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
