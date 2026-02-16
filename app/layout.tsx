import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "sonner";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "متجر الحكيم - زيت زيتون فاخر",
  description: "زيت زيتون فاخر من متجر الحكيم - جودة عالية للصحة والمذاق",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <body className={`${cairo.variable} font-sans antialiased`}>
          {children}
          <Toaster position="top-center" richColors />
        </body>
      </html>
    </Providers>
  );
}
