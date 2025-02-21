import Stripe from "stripe";

/**
 * Lazy singleton for the Stripe server client.
 * Only created on first call — prevents build errors when env vars aren't set yet.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "Missing STRIPE_SECRET_KEY env var. Add it to .env.local"
      );
    }
    client = new Stripe(key);
  }
  return client;
}
