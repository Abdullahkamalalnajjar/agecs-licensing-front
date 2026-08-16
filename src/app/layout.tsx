import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agecs Licensing",
  description: "Next generation software licensing platform",
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
