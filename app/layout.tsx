import { Toaster } from "@/components/ui/toaster"
import "./globals.css";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* 提示 */}
        <Toaster />
      </body>
    </html>
  );
}
