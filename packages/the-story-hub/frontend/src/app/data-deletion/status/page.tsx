"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function DataDeletionStatusContent() {
  const searchParams = useSearchParams();
  const confirmationCode = searchParams.get("id");

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-white mb-6">
          Data Deletion Request Status
        </h1>

        {confirmationCode ? (
          <div className="space-y-4">
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>Confirmation Code:</strong>{" "}
                <code className="bg-gray-900 px-2 py-1 rounded">
                  {confirmationCode}
                </code>
              </p>
            </div>

            <div className="text-gray-300 space-y-3">
              <p>
                Your data deletion request has been received and is being
                processed.
              </p>

              <div className="bg-gray-900 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-white mb-2">
                  What happens next:
                </h2>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>
                    Your account and associated data will be permanently deleted
                    within 30 days
                  </li>
                  <li>
                    This includes your profile, stories, comments, and all
                    personal information
                  </li>
                  <li>
                    Once deleted, this data cannot be recovered
                  </li>
                  <li>
                    You will receive a confirmation email when the deletion is
                    complete
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-400 mt-6">
                If you have any questions or concerns, please contact our
                support team at{" "}
                <a
                  href="mailto:support@thestoryhub.com"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  support@thestoryhub.com
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-gray-300 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-3">
                How to Request Data Deletion
              </h2>
              <p className="mb-4">
                If you signed up using Facebook and want to delete your data
                from The Story Hub, you can request deletion through your
                Facebook settings.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                Steps to Delete Your Data:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to your Facebook Settings & Privacy &gt; Settings
                </li>
                <li>
                  Click on "Apps and Websites" in the left sidebar
                </li>
                <li>
                  Find "The Story Hub" in your list of apps
                </li>
                <li>
                  Click "Remove" to disconnect the app and delete your data
                </li>
                <li>
                  Facebook will send you a confirmation code and link
                </li>
              </ol>
            </div>

            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>What data do we collect?</strong>
              </p>
              <p className="text-blue-100 text-sm mt-2">
                When you sign up with Facebook, we only collect your email
                address and name. We do not store any other Facebook data.
              </p>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                <strong>Note:</strong> If you created stories, comments, or
                other content on The Story Hub, this content may remain on the
                platform even after your account is deleted, in accordance with
                our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-700">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function DataDeletionStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <DataDeletionStatusContent />
    </Suspense>
  );
}
