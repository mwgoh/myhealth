import type { Metadata, Viewport } from "next";
import { StoreGate } from "@/components/StoreGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "운동 기록",
  description: "휴대폰에서 쓰는 운동 기록장",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0f2" },
    { media: "(prefers-color-scheme: dark)", color: "#17191c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <StoreGate>{children}</StoreGate>
      </body>
    </html>
  );
}
