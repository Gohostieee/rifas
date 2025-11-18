import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rifaId, ticketCount, name, email, phone, precio } = body;

    if (!rifaId || !ticketCount || !name || !email || !phone || !precio) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/#ticket-purchase`,
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

