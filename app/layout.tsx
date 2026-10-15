import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feather & Flour Bakery",
  description: "Sales, inventory, recipe costing, tax, expense, event, and financial management for Feather & Flour Bakery.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
