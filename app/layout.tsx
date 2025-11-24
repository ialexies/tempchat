import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TempChat - Simple Chat App",
  description: "A simple temporary chat application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

