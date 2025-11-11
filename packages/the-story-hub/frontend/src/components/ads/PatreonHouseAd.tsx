"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

/**
 * House ad component that rotates between Patreon support and contact us messages
 * Shows when AdSense is not configured or as fallback
 */
export function PatreonHouseAd() {
  const [showPatreon, setShowPatreon] = useState(true);

  useEffect(() => {
    // Randomly choose which ad to show on mount
    setShowPatreon(Math.random() < 0.5);
  }, []);

  if (showPatreon) {
    return (
      <div className="my-8 p-6 rounded-lg bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/50">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2">
              Support The Story Hub
            </h3>
            <p className="text-gray-300 text-sm mb-3">
              Enjoy an ad-free experience and get exclusive benefits by becoming
              a Patreon supporter!
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-400 justify-center md:justify-start">
              <span className="bg-purple-800/30 px-2 py-1 rounded">
                Ad-free browsing
              </span>
              <span className="bg-purple-800/30 px-2 py-1 rounded">
                Early access
              </span>
              <span className="bg-purple-800/30 px-2 py-1 rounded">
                Custom profile
              </span>
              <span className="bg-purple-800/30 px-2 py-1 rounded">
                Exclusive Discord
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="/support"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Become a Supporter
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 p-6 rounded-lg bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-700/50">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-xl font-bold text-white mb-2">
            Have an App Idea?
          </h3>
          <p className="text-gray-300 text-sm mb-3">
            We build custom web and mobile applications. Contact us today to
            discuss your project!
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-gray-400 justify-center md:justify-start">
            <span className="bg-blue-800/30 px-2 py-1 rounded">
              Full-stack development
            </span>
            <span className="bg-blue-800/30 px-2 py-1 rounded">
              Cloud infrastructure
            </span>
            <span className="bg-blue-800/30 px-2 py-1 rounded">
              Mobile apps
            </span>
            <span className="bg-blue-800/30 px-2 py-1 rounded">
              Custom solutions
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Link
            href="/contact"
            className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
