"use client";

import Link from "next/link";
import Image from "next/image";

export default function CopyrightPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-[#2162BF] hover:text-[#422F9F]">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-[#21271C] mb-8">
          Copyright & Licensing
        </h1>

        <div className="prose prose-lg max-w-none text-gray-800 space-y-6">
          <p className="text-sm text-gray-600">
            <strong>Last Updated:</strong> {currentYear}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              Overview
            </h2>
            <p>
              All content on The Story Hub is protected by copyright law and is
              licensed under the
              <strong>
                &nbpsp; Creative Commons Attribution-NonCommercial-NoDerivatives
                4.0 International License (CC BY-NC-ND 4.0)
              </strong>
              .
            </p>
          </section>

          <section className="bg-blue-50 border-l-4 border-blue-400 p-6">
            <h3 className="text-xl font-semibold text-[#21271C] mb-3">
              Copyright Notice
            </h3>
            <p className="text-gray-800 font-medium">
              © {currentYear} The Story Hub and Contributors. All Rights
              Reserved.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              What is CC BY-NC-ND 4.0?
            </h2>
            <p>
              This is the most protective Creative Commons license, designed to
              allow free reading while preventing commercial exploitation and
              unauthorized modifications.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  BY - Attribution
                </h4>
                <p className="text-sm text-gray-700">
                  You must give appropriate credit to the original authors and
                  provide a link to the license.
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">
                  NC - NonCommercial
                </h4>
                <p className="text-sm text-gray-700">
                  You may not use the material for commercial purposes or
                  profit-making activities.
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-2">
                  ND - NoDerivatives
                </h4>
                <p className="text-sm text-gray-700">
                  You may not modify, remix, transform, or build upon the
                  material without permission.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              What You CAN Do
            </h2>
            <div className="bg-green-50 border-l-4 border-green-400 p-6">
              <ul className="list-disc pl-6 space-y-2 text-gray-800">
                <li>Read all stories for free on The Story Hub</li>
                <li>Share links to stories on social media</li>
                <li>Recommend stories to friends and family</li>
                <li>Bookmark and save your favorite stories</li>
                <li>Participate in the community by voting and commenting</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              What You CANNOT Do
            </h2>
            <div className="bg-red-50 border-l-4 border-red-400 p-6">
              <ul className="list-disc pl-6 space-y-2 text-gray-800">
                <li>
                  <strong>Commercial Use:</strong> Sell, license, or monetize
                  any content
                </li>
                <li>
                  <strong>Republishing:</strong> Copy stories to other platforms
                  or publications
                </li>
                <li>
                  <strong>Modifications:</strong> Create translations,
                  adaptations, or derivative works
                </li>
                <li>
                  <strong>Scraping:</strong> Use automated tools to download or
                  harvest content
                </li>
                <li>
                  <strong>Print Publications:</strong> Include stories in books,
                  magazines, or paid materials
                </li>
                <li>
                  <strong>Courses/Training:</strong> Use content in paid
                  educational materials
                </li>
                <li>
                  <strong>Advertising:</strong> Display stories alongside
                  advertisements for profit
                </li>
                <li>
                  <strong>Apps/Products:</strong> Include stories in commercial
                  apps or products
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              Requesting Permission
            </h2>
            <p>
              If you would like to use content in ways not permitted by the CC
              BY-NC-ND 4.0 license, you must obtain explicit written permission
              from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>The Story Hub:</strong> For platform-level permissions
              </li>
              <li>
                <strong>Original Authors:</strong> Each contributor who created
                content you wish to use
              </li>
            </ul>
            <p className="mt-4">
              Contact us through the Platform to request permissions. Note that
              permissions are granted on a case-by-case basis and may involve
              licensing fees.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              Authors&rsquo; Rights
            </h2>
            <p>As a content creator on The Story Hub:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You retain copyright ownership of your original contributions
              </li>
              <li>You grant The Story Hub a license to display your content</li>
              <li>
                Your content is automatically protected under CC BY-NC-ND 4.0
              </li>
              <li>
                You can request removal of your content (subject to Terms of
                Service)
              </li>
              <li>
                You share copyright protection with all contributors to
                collaborative stories
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              DMCA and Copyright Enforcement
            </h2>
            <p>
              We take copyright protection seriously. If you believe your
              copyright has been infringed:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact us immediately with details of the infringement</li>
              <li>Provide proof of copyright ownership</li>
              <li>We will investigate and take appropriate action</li>
            </ul>
            <p className="mt-4">If you are found to be infringing copyright:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We will issue a DMCA takedown notice</li>
              <li>Your account may be suspended or terminated</li>
              <li>Legal action may be taken against you</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              International Copyright
            </h2>
            <p>Copyright protection extends internationally through:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Berne Convention (173 member countries)</li>
              <li>WIPO Copyright Treaty</li>
              <li>National copyright laws in applicable jurisdictions</li>
            </ul>
            <p className="mt-4">
              Violations may be prosecuted in multiple jurisdictions.
            </p>
          </section>

          <section className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-8">
            <h3 className="text-xl font-semibold text-[#21271C] mb-3">
              Important Reminder
            </h3>
            <p className="text-gray-800">
              <strong>
                Just because content is free to read does NOT mean it&rsquo;s
                free to use commercially.
              </strong>
              Always respect creators&rsquo; rights and the license terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">
              Learn More
            </h2>
            <div className="space-y-2">
              <p>
                <Link
                  href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2162BF] hover:text-[#422F9F] underline"
                >
                  Full CC BY-NC-ND 4.0 License Text
                </Link>
              </p>
              <p>
                <Link
                  href="https://creativecommons.org/licenses/by-nc-nd/4.0/legalcode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2162BF] hover:text-[#422F9F] underline"
                >
                  Legal Code (Full Legal Terms)
                </Link>
              </p>
              <p>
                <Link
                  href="/legal/terms"
                  className="text-[#2162BF] hover:text-[#422F9F] underline"
                >
                  Our Terms of Service
                </Link>
              </p>
            </div>
          </section>
          <section className="mt-8">
            <div>
              <Link
                href="https://creativecommons.org/licenses/by-nc-nd/4.0/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="https://licensebuttons.net/l/by-nc-nd/4.0/88x31.png"
                  alt="CC BY-NC-ND 4.0 License"
                  width={88}
                  height={31}
                  className="h-10"
                />
              </Link>
            </div>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-gray-600 text-center">
            Questions about copyright or licensing? Contact us through the
            Platform.
          </p>
        </div>
      </div>
    </div>
  );
}
