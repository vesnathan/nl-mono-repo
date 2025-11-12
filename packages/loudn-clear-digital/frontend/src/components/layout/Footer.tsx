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
                Full-service digital agency specializing in web development,
                social media management, and digital marketing solutions.
              </p>
              <p className="text-gray-300 text-sm font-roboto-slab">
                We partner with businesses to create compelling digital
                experiences that drive growth and engagement.
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
                    href="/quote?service=WEB_DEVELOPMENT"
                    className="hover:text-brand-green transition-colors"
                  >
                    Web Development
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=ECOMMERCE"
                    className="hover:text-brand-green transition-colors"
                  >
                    E-Commerce Solutions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=SOCIAL_MEDIA"
                    className="hover:text-brand-green transition-colors"
                  >
                    Social Media Management
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=DIGITAL_MARKETING"
                    className="hover:text-brand-green transition-colors"
                  >
                    Digital Marketing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=BRANDING"
                    className="hover:text-brand-green transition-colors"
                  >
                    Brand Identity
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quote?service=SEO"
                    className="hover:text-brand-green transition-colors"
                  >
                    SEO & Analytics
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

            {/* Contact */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-4 font-josefin">
                Get In Touch
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm font-roboto-slab">
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <span>📧</span> hello@loudncleardigital.com
                </li>
                <li className="flex items-center gap-2 justify-center md:justify-start">
                  <span>📍</span> Serving Businesses Nationally
                </li>
                <li className="pt-2">
                  <Link
                    href="/quote"
                    className="text-brand-green font-semibold hover:text-brand-green/80 transition-colors"
                  >
                    → Get a Free Quote
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
              &copy; {new Date().getFullYear()} Loud'n'Clear Digital. All rights
              reserved.
            </p>
            <p className="mt-2">
              Web Development | Digital Marketing | Social Media Management
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
