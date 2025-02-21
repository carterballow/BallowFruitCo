import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { CartProvider } from "@/components/cart-context";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"),
  title: "Ballow Fruit Co.",
  description:
    "Order fresh naval oranges, blood oranges, lemons, limes, pomegranates, and avocados direct from the Ballow family farm in Encinitas, California.",
  icons: {
    icon: "/ballowfruitcometadata.png",
    apple: "/ballowfruitcometadata.png",
  },
  openGraph: {
    title: "Ballow Fruit Co.",
    description: "Family-grown citrus and avocados direct from Encinitas, CA.",
    images: [{ url: "/ballowfruitcometadata.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} min-h-screen antialiased`}>
        {/* CartProvider wraps everything so every page can read/update the cart */}
        <CartProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
