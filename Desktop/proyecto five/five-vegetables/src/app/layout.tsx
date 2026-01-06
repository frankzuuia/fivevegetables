import type { Metadata } from "next";
import { inter, raleway } from "@/lib/fonts";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { HydrationWrapper } from "@/components/HydrationWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Five Vegetables - B2B Premium",
  description: "Venta B2B de frutas y verduras premium con entrega al día siguiente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${raleway.variable}`}>
      <body className={`${inter.className} antialiased bg-morph-bg text-morph-gray-900`}>
        <QueryProvider>
          <HydrationWrapper>
            {children}
          </HydrationWrapper>
        </QueryProvider>
      </body>
    </html>
  );
}
