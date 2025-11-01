"use client";

import Link from "next/link";

export default function TermsOfService() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-[#2162BF] hover:text-[#422F9F]">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-[#21271C] mb-8">Terms of Service</h1>

        <div className="prose prose-lg max-w-none text-gray-800 space-y-6">
          <p className="text-sm text-gray-600">
            <strong>Last Updated:</strong> {currentYear}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using The Story Hub ("the Platform"), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">2. Content Ownership and Licensing</h2>
            <p>
              All content published on The Story Hub, including stories, chapters, and branches, is protected by copyright
              and is licensed under the <strong>Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International License
              (CC BY-NC-ND 4.0)</strong>.
            </p>

            <h3 className="text-xl font-semibold text-[#21271C] mt-6 mb-3">2.1 What This Means:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Attribution (BY):</strong> You must give appropriate credit to the original authors.</li>
              <li><strong>Non-Commercial (NC):</strong> You may not use the content for commercial purposes or profit-making activities.</li>
              <li><strong>No Derivatives (ND):</strong> You may not modify, remix, or create derivative works from the content without explicit permission.</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#21271C] mt-6 mb-3">2.2 What You CAN Do:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Read stories freely on the Platform</li>
              <li>Share links to stories on social media</li>
              <li>Recommend stories to others</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#21271C] mt-6 mb-3">2.3 What You CANNOT Do:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Copy stories for commercial use or profit</li>
              <li>Republish content on other platforms without permission</li>
              <li>Sell, license, or monetize any content from the Platform</li>
              <li>Create derivative works (adaptations, translations, etc.) without authorization</li>
              <li>Use content in paid publications, courses, or products</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">3. Prohibition Against Scraping and Automated Access</h2>
            <p>
              <strong>Strictly Prohibited:</strong> The following activities are expressly forbidden:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Automated scraping, crawling, or harvesting of content</li>
              <li>Use of bots, spiders, or automated tools to access the Platform</li>
              <li>Mass downloading or copying of stories</li>
              <li>Systematic retrieval of data or content</li>
              <li>Using automated means to create accounts or post content</li>
              <li>Reverse engineering or attempting to extract source code</li>
            </ul>
            <p className="mt-4">
              <strong>Consequences:</strong> Violation of this prohibition may result in:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Immediate termination of your account</li>
              <li>IP address blocking</li>
              <li>Legal action including claims for damages</li>
              <li>Reporting to relevant authorities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">4. User Contributions</h2>
            <p>
              By submitting content to The Story Hub (stories, chapters, comments, etc.):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You retain copyright ownership of your original content</li>
              <li>You grant The Story Hub a license to display and distribute your content on the Platform</li>
              <li>You agree that your content will be licensed under CC BY-NC-ND 4.0</li>
              <li>You warrant that you have the right to submit the content and it doesn't infringe on others' rights</li>
              <li>You agree not to submit content that is illegal, harmful, or violates these Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">5. Copyright Protection</h2>
            <p>
              All content is protected under international copyright law. Unauthorized use may result in:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>DMCA takedown notices</li>
              <li>Legal action for copyright infringement</li>
              <li>Claims for statutory damages</li>
              <li>Injunctive relief</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">6. Acceptable Use Policy</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Platform for any illegal purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post spam, malware, or malicious content</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Interfere with or disrupt the Platform's operation</li>
              <li>Attempt to gain unauthorized access to systems or accounts</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">7. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, without notice, for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violation of these Terms of Service</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Extended periods of inactivity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">8. Disclaimer of Warranties</h2>
            <p>
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Uninterrupted or error-free operation</li>
              <li>Accuracy or reliability of content</li>
              <li>Fitness for any particular purpose</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, The Story Hub and its operators shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your use of the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Platform after changes
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">11. Contact Information</h2>
            <p>
              For questions about these Terms or to report violations, please contact us through the Platform.
            </p>
          </section>

          <section className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mt-8">
            <h3 className="text-xl font-semibold text-[#21271C] mb-3">Important Reminder</h3>
            <p className="text-gray-800">
              <strong>Commercial Use is Strictly Prohibited.</strong> If you wish to use any content for commercial
              purposes, you must obtain explicit written permission from both The Story Hub and the original content creators.
            </p>
          </section>

          <section className="bg-red-50 border-l-4 border-red-400 p-6 mt-4">
            <h3 className="text-xl font-semibold text-[#21271C] mb-3">Anti-Scraping Warning</h3>
            <p className="text-gray-800">
              <strong>Automated scraping is illegal and will be prosecuted.</strong> We actively monitor for scraping
              activity and will take immediate legal action against violators.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-gray-600 text-center">
            By using The Story Hub, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
