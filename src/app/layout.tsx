import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/ui/nav";

export const metadata: Metadata = {
  title: "NORAD — Command Center",
  description: "WOPR pipeline monitoring dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistMono.variable} antialiased min-h-screen`}>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
