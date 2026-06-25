import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Raznova — Two-Wheeler Spare Parts Export",
  description:
    "Raznova exports genuine and OEM-grade two-wheeler spare parts to Latin America and Africa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
