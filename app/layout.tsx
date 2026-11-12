import type { Metadata } from "next";
import "./globals.css";
import "./sms.css";

export const metadata: Metadata = {
  title: "Feather & Flour Bakery",
  description: "Fresh cookies in seven delicious flavors, baked to order by Feather & Flour Bakery in Mobile, Alabama.",
  icons: {
    icon: "/feather-flour-favicon.svg",
    shortcut: "/feather-flour-favicon.svg",
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
