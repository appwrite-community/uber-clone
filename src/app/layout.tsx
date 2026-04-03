import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import DevModeProvider from "@/components/DevModeProvider";
import DevModeModal from "@/components/DevModeModal";

export const metadata: Metadata = {
  title: "RideAlong - Uber Clone",
  description: "A real-time ride-hailing app built with Next.js and Appwrite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="h-full flex flex-col bg-zinc-950 text-zinc-100">
        <AuthProvider>
          <DevModeProvider>
            {children}
            <DevModeModal />
          </DevModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
