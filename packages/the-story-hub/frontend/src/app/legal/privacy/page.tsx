"use client";

import Link from "next/link";

export default function PrivacyPolicy() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/" className="text-[#2162BF] hover:text-[#422F9F]">
            ← Back to Home
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-[#21271C] mb-8">Privacy Policy</h1>

        <div className="prose prose-lg max-w-none text-gray-800 space-y-6">
          <p className="text-sm text-gray-600">
            <strong>Last Updated:</strong> {currentYear}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">1. Introduction</h2>
            <p>
              The Story Hub ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.
              This Privacy Policy explains how we collect, use, and protect your information when you use our Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-[#21271C] mt-6 mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Username, email address, password</li>
              <li><strong>Profile Information:</strong> Bio, profile picture, preferences</li>
              <li><strong>Content:</strong> Stories, chapters, comments, votes you submit</li>
              <li><strong>Communications:</strong> Messages you send to us or other users</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#21271C] mt-6 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Usage Data:</strong> Pages viewed, time spent, features used</li>
              <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
              <li><strong>Cookies:</strong> Session data, preferences, analytics</li>
              <li><strong>Log Data:</strong> Access times, error logs, referral URLs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provide Services:</strong> Enable account functionality, display content, process interactions</li>
              <li><strong>Improve Platform:</strong> Analyze usage patterns, fix bugs, develop features</li>
              <li><strong>Communication:</strong> Send notifications, updates, support messages</li>
              <li><strong>Security:</strong> Prevent fraud, abuse, and unauthorized access</li>
              <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">4. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share information in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Public Content:</strong> Stories, chapters, comments, and profiles are publicly visible</li>
              <li><strong>Service Providers:</strong> Third-party services that help operate the Platform (hosting, analytics, email)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or legal process</li>
              <li><strong>Safety:</strong> To protect rights, property, or safety of The Story Hub, users, or public</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">5. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze how you use the Platform</li>
              <li>Provide personalized content and recommendations</li>
            </ul>
            <p className="mt-4">
              You can control cookies through your browser settings, but some features may not work properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">6. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication systems</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and monitoring</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">7. Your Rights and Choices</h2>
            <p>
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Data Portability:</strong> Request your data in a portable format</li>
              <li><strong>Restriction:</strong> Request limitation of processing</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us through the Platform or email us at privacy@thestoryhub.com (if applicable).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">8. Children's Privacy</h2>
            <p>
              The Story Hub is not intended for users under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you believe we have collected information from a child under 13,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. By using the Platform,
              you consent to such transfers. We take steps to ensure your data receives adequate protection.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">10. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide services to you</li>
              <li>Comply with legal obligations</li>
              <li>Resolve disputes and enforce agreements</li>
            </ul>
            <p className="mt-4">
              When you delete your account, we will delete or anonymize your personal information, except where we are
              required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">11. Third-Party Links</h2>
            <p>
              The Platform may contain links to third-party websites. We are not responsible for the privacy practices
              of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting
              a notice on the Platform or sending an email. Your continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[#21271C] mt-8 mb-4">13. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us through the
              Platform or at privacy@thestoryhub.com.
            </p>
          </section>

          <section className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-8">
            <h3 className="text-xl font-semibold text-[#21271C] mb-3">Your Privacy Matters</h3>
            <p className="text-gray-800">
              We are committed to protecting your privacy and handling your data responsibly. If you have any concerns,
              please don't hesitate to reach out to us.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-gray-600 text-center">
            By using The Story Hub, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
