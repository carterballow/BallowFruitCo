import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

type CheckoutItem = {
  name: string;
  unit: string;
  price: number;
  quantity: number;
};

export async function POST(req: NextRequest) {
  try {
    const { items, customerName, customerEmail } = await req.json();

    if (!items?.length || !customerName || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields: items, customerName, customerEmail" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customerEmail,
      metadata: {
        customer_name: customerName,
        customer_email: customerEmail,
      },
      line_items: items.map((item: CheckoutItem) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            description: item.unit,
          },
          unit_amount: item.price,
        },
        quantity: item.quantity,
      })),
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/order`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
