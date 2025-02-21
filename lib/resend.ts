import { Resend } from "resend";

// Lazy singleton — only created when first called, not at module load time.
// Prevents the "Missing API key" build error when env vars aren't set.
let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "Missing RESEND_API_KEY env var. Add it to .env.local"
      );
    }
    client = new Resend(key);
  }
  return client;
}

// The email address that orders get sent to (owner's inbox).
export const OWNER_EMAIL = () => process.env.OWNER_EMAIL ?? "";

// The "From" address shown in the email.
// Must be a verified domain on Resend, OR use onboarding@resend.dev for testing.
export const FROM_EMAIL = () =>
  process.env.FROM_EMAIL ?? "Ballow Fruit Co. <onboarding@resend.dev>";
