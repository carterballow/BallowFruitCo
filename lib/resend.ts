import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("Missing RESEND_API_KEY env var. Add it to .env.local");
    }
    client = new Resend(key);
  }
  return client;
}

export const OWNER_EMAIL = () => process.env.OWNER_EMAIL ?? "";
export const FROM_EMAIL = () =>
  process.env.FROM_EMAIL ?? "Ballow Fruit Co. <onboarding@resend.dev>";
