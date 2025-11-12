"use client";

import { ReactNode } from "react";
import { NextUIProvider } from "@nextui-org/react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>
          Loud'n'Clear Digital - Web Development & Digital Solutions
        </title>
        <meta
          name="description"
          content="Professional web development and digital solutions. We build modern, responsive websites and web applications tailored to your business needs."
        />
        <link
          rel="icon"
          href="/images/loudnclear-logo.webp"
          type="image/webp"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Josefin+Sans:100,100italic,300,300italic,400,400italic,600,600italic,700,700italic"
          rel="stylesheet"
          type="text/css"
        />
        <link
          href="https://fonts.googleapis.com/css?family=Roboto+Slab:100,300,400,700"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body>
        <NextUIProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </NextUIProvider>
      </body>
    </html>
  );
}
