import type { Metadata } from "next";
import "./globals.css";
import { GoogleAuthProviderWrapper } from "@/components/GoogleAuthProviderWrapper";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Agecs Licensing | Admin Dashboard",
  description: "Next generation software licensing platform — manage products, promocodes, and support tickets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sofia+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <GoogleAuthProviderWrapper>
            {children}
          </GoogleAuthProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
