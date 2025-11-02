"use client";

import Link from "next/link";

interface CopyrightNoticeProps {
  storyTitle?: string;
  authorName?: string;
  year?: number;
}

export default function CopyrightNotice({
  storyTitle,
  authorName,
  year = new Date().getFullYear(),
}: CopyrightNoticeProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Copyright Text */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#21271C] mb-2">
            Copyright & License
          </h3>
          <p className="text-sm text-gray-700 mb-2">
            © {year} Individual Contributors. All rights reserved.
          </p>
          {storyTitle && authorName && (
            <p className="text-sm text-gray-600 mb-3">
              "{storyTitle}" by {authorName} and contributors
            </p>
          )}
          <p className="text-sm text-gray-700 mb-3">
            Each contributor retains copyright to their contributions. By
            contributing, authors grant The Story Hub a non-exclusive license to
            display and distribute their work under{" "}
            <Link
              href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2162BF] hover:text-[#422F9F] font-medium underline"
            >
              CC BY-NC-ND 4.0
            </Link>
            . Contributors are responsible for enforcing their own copyrights.
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>✓ Free to read and share with attribution</p>
            <p>✗ No commercial use without permission</p>
            <p>✗ No derivative works</p>
          </div>
        </div>

        {/* CC License Badge */}
        <div className="flex flex-col items-center md:items-end gap-2">
          <Link
            href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img
              src="https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png"
              alt="CC BY-NC-ND 4.0"
              className="h-8"
            />
          </Link>
          <Link
            href="/legal/terms"
            className="text-xs text-[#2162BF] hover:text-[#422F9F] underline"
          >
            View Terms of Service
          </Link>
        </div>
      </div>

      {/* Community Guidelines */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-700">
          <strong>Please respect our community:</strong> This platform is built
          by writers, for writers. Commercial scraping, unauthorized
          republication, or use of human-authored content for AI training
          violates both the spirit of our community and the CC license terms.
          AI-created content on this platform may be used for AI training
          purposes. If you'd like to use any content commercially, please
          contact the individual authors directly.
        </p>
      </div>
    </div>
  );
}
