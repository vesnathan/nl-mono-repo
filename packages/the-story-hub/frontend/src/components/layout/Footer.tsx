"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#21271C] text-white py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/images/logo-small.png"
                alt="The Story Hub"
                width={40}
                height={40}
              />
              <span className="ml-2 text-lg font-semibold">The Story Hub</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Collaborative storytelling platform where imagination branches
              into infinite possibilities.
            </p>
          </div>

          {/* Legal Section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/legal/terms"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/privacy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/copyright"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Copyright & Licensing
                </Link>
              </li>
              <li>
                <Link
                  href="/data-deletion/status"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Data Deletion Requests
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Community</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/browse"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Browse Stories
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Support Us
                </Link>
              </li>
            </ul>
          </div>

          {/* License Info Section */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Content License</h3>
            <p className="text-gray-400 text-sm mb-2">
              All stories are protected under:
            </p>
            <Link
              href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F28C28] hover:text-[#2162BF] transition-colors text-sm font-medium"
            >
              CC BY-NC-ND 4.0
            </Link>
            <p className="text-gray-400 text-xs mt-2">
              Free to read, not for commercial use
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              <div>
                © {currentYear} The Story Hub and Contributors. All Rights
                Reserved.
              </div>
              <div className="text-xs mt-1">
                Platform © {currentYear} Nathan Loudon
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white text-sm"
              >
                <img
                  src="https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png"
                  alt="CC BY-NC-ND 4.0"
                  className="h-6"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Anti-Scraping Notice */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-xs">
            Automated scraping, crawling, or harvesting of content is strictly
            prohibited and violates our Terms of Service.
          </p>
        </div>
      </div>
    </footer>
  );
}
