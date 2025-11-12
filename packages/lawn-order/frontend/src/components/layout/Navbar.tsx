"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed w-full z-40 transition-all duration-300 ${scrolled ? "bg-black/80" : "bg-transparent"}`}
      >
        <div className="container mx-auto px-4">
          <div
            className={`flex md:justify-between justify-center items-center transition-all duration-300 ${scrolled ? "py-2" : "py-4"}`}
          >
            <Link href="/" className="flex items-center">
              <img
                src="/images/logo.png"
                alt="Tommy's Law'n Order"
                className={`w-auto object-contain transition-all duration-300 ${scrolled ? "h-16" : "h-32 md:h-48"}`}
              />
            </Link>
            <div className="hidden md:flex items-center gap-6 h-16">
              <Link
                href="/"
                className="text-white font-semibold hover:text-brand-green transition-colors"
              >
                Home
              </Link>
              <Link
                href="/contact"
                className="text-white font-semibold hover:text-brand-green transition-colors"
              >
                Contact
              </Link>
              <Link
                href="/quote"
                className="bg-brand-green text-white font-bold px-6 py-2 rounded hover:bg-brand-green/90 transition-colors uppercase text-sm"
              >
                Get a Quote
              </Link>
            </div>

            {/* Mobile Hamburger Menu Button - Fixed Position */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden fixed right-4 top-4 z-50 w-12 h-12 flex flex-col items-center justify-center gap-1.5 bg-brand-green rounded-lg hover:bg-brand-green/90 transition-colors"
              aria-label="Toggle menu"
            >
              <span
                className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
              ></span>
              <span
                className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`}
              ></span>
              <span
                className={`w-6 h-0.5 bg-white transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
              ></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 z-50 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div
          className={`fixed right-0 top-0 h-full w-64 bg-brand-dark transform transition-transform duration-300 z-50 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex flex-col pt-20 px-6">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white text-lg font-semibold py-4 border-b border-gray-700 hover:text-brand-green transition-colors"
            >
              Home
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-white text-lg font-semibold py-4 border-b border-gray-700 hover:text-brand-green transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/quote"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-6 bg-brand-green text-white font-bold px-6 py-3 rounded hover:bg-brand-green/90 transition-colors uppercase text-sm text-center"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
