import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feather & Flour Bakery",
  description: "Custom-made cookies for birthdays, weddings, showers, business events, and every sweet celebration in Mobile, Alabama.",
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
