import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Civic Pulse",
  description: "A live availability layer for community help."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
