import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ObritTravel - AI Multi-Agent Travel Itinerary Planner",
  description: "Plan personalized, multi-day travel itineraries powered by intelligent AI agents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
