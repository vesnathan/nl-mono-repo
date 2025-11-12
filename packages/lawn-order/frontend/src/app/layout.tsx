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
          Tommy's Law'n Order - Property Maintenance for Holiday Rental Hosts
        </title>
        <meta
          name="description"
          content="Professional property maintenance for Airbnb, Booking.com & VRBO hosts in Devonport area (7310 & 7306). Lawn mowing, whipper snippering, pruning, gutter cleaning, pressure washing."
        />
        <link rel="icon" href="/images/logo.png" type="image/png" />
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
