import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Solana 钱包监控",
  description: "监控 Solana 钱包交易的应用程序",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <head>
        {/* 移除 Font Awesome CDN 链接 */}
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}