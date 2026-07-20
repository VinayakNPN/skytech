import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skytech Program Management System",
  description: "Enterprise Manufacturing Workflow & Program Management Platform for Skytech Switchgear",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('skytech_sidebar_open')==='false'){document.documentElement.classList.add('sidebar-collapsed');}}catch(e){}})();`
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F8FAFC]">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
