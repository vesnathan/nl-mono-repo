"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-white">
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4 font-josefin">About Us</h3>
              <p className="text-gray-300 mb-4 font-roboto-slab text-sm">
                Professional property maintenance for Airbnb, Booking.com & VRBO
                hosts in the Devonport area.
              </p>
              <p className="text-gray-300 text-sm font-roboto-slab">
                Supporting meaningful employment - Tommy is building his future
                through quality work, supervised by qualified horticulturalists
                and experienced 4.98★ Airbnb hosts.
              </p>
              <ul className="flex gap-3 mt-4 justify-center md:justify-start">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-brand-green transition-colors"
                  >
                    <i className="fa fa-facebook">f</i>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-brand-green transition-colors"
                  >
                    <i className="fa fa-twitter">t</i>
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-brand-green transition-colors"
                  >
                    <i className="fa fa-google-plus">g+</i>
                  </a>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4 font-josefin">
                Our Services
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm font-roboto-slab">
                <li>
                  <Link
                    href="/quote?service=LAWN_MOWING"
                    className="hover:text-brand-green transition-colors"
                  >
                    Lawn Mowing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=WHIPPER_SNIPPERING"
                    className="hover:text-brand-green transition-colors"
                  >
                    Whipper Snippering
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=GROUND_PRUNING"
                    className="hover:text-brand-green transition-colors"
                  >
                    Ground Level Pruning
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=WASTE_REMOVAL"
                    className="hover:text-brand-green transition-colors"
                  >
                    Garden Waste Removal
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=GUTTER_CLEANING"
                    className="hover:text-brand-green transition-colors"
                  >
                    Gutter Cleaning
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=PRESSURE_WASHING"
                    className="hover:text-brand-green transition-colors"
                  >
                    Pressure Washing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4 font-josefin">
                Quick Links
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm font-roboto-slab">
                <li>
                  <Link
                    href="/"
                    className="hover:text-brand-green transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote"
                    className="hover:text-brand-green transition-colors"
                  >
                    Get a Quote
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-brand-green transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Service Area */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4 font-josefin">
                Service Area
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm font-roboto-slab">
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <span>📍</span> Devonport & Surrounds
                </li>
                <li>Postcodes: 7310 & 7306</li>
                <li className="pt-2">
                  <Link
                    href="/quote"
                    className="text-brand-green font-semibold hover:text-brand-green/80 transition-colors"
                  >
                    → Get a Quote
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-700 py-6 relative">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-400 text-sm font-roboto-slab">
            <p>
              &copy; {new Date().getFullYear()} Tommy's Law'n Order. All rights
              reserved.
            </p>
            <p className="mt-2">
              Servicing Holiday Rental Properties in Devonport, Tasmania
            </p>
          </div>
        </div>
        <a
          href="https://loudncleardigital.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center hover:opacity-80 transition-opacity absolute"
          style={{ bottom: "5px", right: "8px" }}
        >
          <Image
            src="/images/loudnclear-logo.webp"
            alt="Loud'n Clear Digital"
            width={360}
            height={90}
            className="h-20 w-auto"
          />
        </a>
        <div className="container mx-auto px-4 mt-4 md:hidden text-center">
          <a
            href="https://loudncleardigital.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/images/loudnclear-logo.webp"
              alt="Loud'n Clear Digital"
              width={360}
              height={90}
              className="h-20 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
