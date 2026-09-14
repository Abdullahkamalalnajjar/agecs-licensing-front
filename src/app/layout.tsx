import type { Metadata } from "next";
import "./globals.css";
import { GoogleAuthProviderWrapper } from "@/components/GoogleAuthProviderWrapper";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper";

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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>
            <GoogleAuthProviderWrapper>
              <ThemeProviderWrapper>
                {children}
              </ThemeProviderWrapper>
            </GoogleAuthProviderWrapper>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
