"use client";

import { useState, useEffect } from "react";
import { RequireAdmin } from "@/components/common/RequireAdmin";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { getSiteSettingsAPI, updateSiteSettingsAPI } from "@/lib/api/settings";
import type { SiteSettings } from "@/types/SettingsSchemas";
import {
  getPatreonSecretsAPI,
  updatePatreonSecretsAPI,
} from "@/lib/api/patreonSecrets";
import type { PatreonSecrets } from "@/types/PatreonSecretsSchemas";
import {
  getGoogleOAuthSecretsAPI,
  updateGoogleOAuthSecretsAPI,
} from "@/lib/api/googleOAuthSecrets";
import type { GoogleOAuthSecrets } from "@/types/GoogleOAuthSecretsSchemas";
import {
  getFacebookOAuthSecretsAPI,
  updateFacebookOAuthSecretsAPI,
} from "@/lib/api/facebookOAuthSecrets";
import type { FacebookOAuthSecrets } from "@/types/FacebookOAuthSecretsSchemas";

// Reusable Components for Settings UI

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function SettingsSection({
  title,
  description,
  children,
  defaultExpanded = true,
}: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-gray-750 transition-colors flex items-center justify-between"
      >
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-4 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="space-y-4">{children}</div>
        </div>
      )}
    </div>
  );
}

interface SettingToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function SettingToggle({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: SettingToggleProps) {
  const toggleId = `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-700 last:border-b-0 last:pb-0">
      <div className="flex-1">
        <label htmlFor={toggleId} className="text-white font-medium block mb-1">
          {label}
        </label>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <div className="flex-shrink-0 pt-1">
        <button
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={label}
          disabled={disabled}
          onClick={() => onChange(!enabled)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full
            transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800
            ${enabled ? "bg-blue-600" : "bg-gray-600"}
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white
              transition-transform duration-200 ease-in-out
              ${enabled ? "translate-x-6" : "translate-x-1"}
            `}
          />
        </button>
      </div>
    </div>
  );
}

interface SettingInputProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "password";
  disabled?: boolean;
}

function SettingInput({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: SettingInputProps) {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="py-4 border-b border-gray-700 last:border-b-0 last:pb-0">
      <label htmlFor={inputId} className="text-white font-medium block mb-1">
        {label}
      </label>
      <p className="text-gray-400 text-sm mb-3">{description}</p>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full px-4 py-2 rounded-lg
          bg-gray-700 border border-gray-600
          text-white placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      />
    </div>
  );
}

function AdminSettingsContent() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [patreonSecrets, setPatreonSecrets] = useState<PatreonSecrets | null>(
    null,
  );
  const [googleOAuthSecrets, setGoogleOAuthSecrets] =
    useState<GoogleOAuthSecrets | null>(null);
  const [facebookOAuthSecrets, setFacebookOAuthSecrets] =
    useState<FacebookOAuthSecrets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showFacebookRedeployModal, setShowFacebookRedeployModal] =
    useState(false);
  const [showOAuthStatusModal, setShowOAuthStatusModal] = useState(false);
  const [oauthStatusModalData, setOAuthStatusModalData] = useState<{
    provider: string;
    status: string;
    enabled: boolean;
  } | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [
        settingsData,
        secretsData,
        googleSecretsData,
        facebookSecretsData,
      ] = await Promise.all([
        getSiteSettingsAPI(),
        getPatreonSecretsAPI(),
        getGoogleOAuthSecretsAPI(),
        getFacebookOAuthSecretsAPI(),
      ]);
      setSettings(settingsData);
      setPatreonSecrets(secretsData);
      setGoogleOAuthSecrets(googleSecretsData);
      setFacebookOAuthSecrets(facebookSecretsData);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setError("Failed to load site settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChange = async (
    field: keyof SiteSettings,
    value: boolean | string,
  ) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      const updatedSettings = await updateSiteSettingsAPI({
        [field]: value,
      });

      setSettings(updatedSettings);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOAuthToggleChange = async (
    provider: "Google" | "Facebook" | "Apple",
    field: "googleOAuthEnabled" | "facebookOAuthEnabled" | "appleOAuthEnabled",
    value: boolean,
  ) => {
    if (!settings) return;

    // Show status modal when toggling ON
    if (value) {
      let status = "";
      if (provider === "Google") {
        status = "Working as expected";
      } else if (provider === "Facebook") {
        status =
          "Needs a new account without FB Business account disabled. See FACEBOOK_OAUTH_SETUP.md for details.";
      } else if (provider === "Apple") {
        status = "Not yet implemented. Coming soon.";
      }

      setOAuthStatusModalData({
        provider,
        status,
        enabled: value,
      });
      setShowOAuthStatusModal(true);
    }

    // Save the toggle state
    await handleToggleChange(field, value);
  };

  const handlePatreonSecretChange = async (
    field: keyof PatreonSecrets,
    value: string,
  ) => {
    if (!patreonSecrets) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      await updatePatreonSecretsAPI({
        [field]: value,
      });

      // Reload secrets to get masked values
      const updatedSecrets = await getPatreonSecretsAPI();
      setPatreonSecrets(updatedSecrets);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update Patreon secrets:", err);
      setError("Failed to save Patreon secrets. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoogleOAuthSecretChange = async (
    field: keyof GoogleOAuthSecrets,
    value: string,
  ) => {
    if (!googleOAuthSecrets) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      await updateGoogleOAuthSecretsAPI({
        [field]: value,
      });

      // Reload secrets to get masked values
      const updatedSecrets = await getGoogleOAuthSecretsAPI();
      setGoogleOAuthSecrets(updatedSecrets);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update Google OAuth secrets:", err);
      setError("Failed to save Google OAuth secrets. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFacebookOAuthSecretChange = async (
    field: keyof FacebookOAuthSecrets,
    value: string,
  ) => {
    if (!facebookOAuthSecrets) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      // Send only the field that changed (partial update)
      await updateFacebookOAuthSecretsAPI({
        [field]: value,
      } as Partial<FacebookOAuthSecrets>);

      // Reload secrets to get masked values
      const updatedSecrets = await getFacebookOAuthSecretsAPI();
      setFacebookOAuthSecrets(updatedSecrets);
      setSaveSuccess(true);

      // Show redeploy reminder modal
      setShowFacebookRedeployModal(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update Facebook OAuth secrets:", err);
      setError("Failed to save Facebook OAuth secrets. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner label="Loading settings..." />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorMessage message={error} retry={loadSettings} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
          <p className="text-gray-400 mt-2">
            Configure site-wide settings and features
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Save Success Message */}
          {saveSuccess && (
            <div className="bg-green-900/50 border border-green-700 text-green-100 px-4 py-3 rounded-lg">
              Settings saved successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Error Tracking Settings Section */}
          <SettingsSection
            title="Error Tracking & Bug Reporting"
            description="Configure Sentry for automatic error tracking and user bug reports"
          >
            {/* Setup Instructions */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-4">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Sentry Setup Instructions
              </h3>
              <ol className="text-gray-300 text-sm space-y-2 ml-7 list-decimal">
                <li>
                  Create a free account at{" "}
                  <a
                    href="https://sentry.io/signup/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    sentry.io/signup
                  </a>
                </li>
                <li>
                  Create a new project and select{" "}
                  <span className="font-mono bg-gray-800 px-1 rounded">
                    Next.js
                  </span>{" "}
                  as the platform
                </li>
                <li>
                  Copy your DSN from the project settings (Settings → Client
                  Keys)
                </li>
                <li>Paste the DSN below and enable Sentry tracking</li>
                <li>
                  Click Save Settings - Sentry will automatically start tracking
                  errors
                </li>
              </ol>
              <div className="mt-3 pt-3 border-t border-blue-700/30">
                <p className="text-gray-400 text-xs">
                  <strong>Free tier includes:</strong> 50,000 errors/month,
                  30-day retention, unlimited team members
                </p>
              </div>
            </div>

            <SettingToggle
              label="Enable Sentry Error Tracking"
              description="Enable automatic error tracking with Sentry. Errors will be captured and sent to your Sentry project for monitoring."
              enabled={settings?.sentryEnabled ?? false}
              onChange={(value) => handleToggleChange("sentryEnabled", value)}
              disabled={isSaving}
            />

            <SettingInput
              label="Sentry DSN (Data Source Name)"
              description="Your Sentry project DSN from https://sentry.io. Format: https://[key]@[org].ingest.sentry.io/[project]"
              value={settings?.sentryDsn ?? ""}
              onChange={(value) => handleToggleChange("sentryDsn", value)}
              placeholder="https://examplePublicKey@o0.ingest.sentry.io/0"
              disabled={isSaving}
            />
          </SettingsSection>

          {/* Badge Settings Section */}
          <SettingsSection
            title="Badge Settings"
            description="Configure how badges are awarded to users"
          >
            <SettingToggle
              label="Grant OG Badge to Patreon Supporters"
              description="When enabled, new Patreon supporters will automatically receive the Early Supporter (OG) badge when they connect their Patreon account. This is useful during early development to recognize early supporters."
              enabled={settings?.grantOGBadgeToPatreonSupporters ?? false}
              onChange={(value) =>
                handleToggleChange("grantOGBadgeToPatreonSupporters", value)
              }
              disabled={isSaving}
            />
          </SettingsSection>

          {/* OAuth Provider Settings Section */}
          <SettingsSection
            title="OAuth Provider Settings"
            description="Enable or disable third-party OAuth providers for user authentication. When enabled, provider buttons will appear on the login/registration modal."
          >
            <SettingToggle
              label="Google OAuth"
              description="Enable Google Sign-In for user authentication. Currently working as expected."
              enabled={settings?.googleOAuthEnabled ?? false}
              onChange={(value) =>
                handleOAuthToggleChange("Google", "googleOAuthEnabled", value)
              }
              disabled={isSaving}
            />
            <SettingToggle
              label="Facebook OAuth"
              description="Enable Facebook Login for user authentication. Requires a new Facebook App without FB Business account disabled."
              enabled={settings?.facebookOAuthEnabled ?? false}
              onChange={(value) =>
                handleOAuthToggleChange(
                  "Facebook",
                  "facebookOAuthEnabled",
                  value,
                )
              }
              disabled={isSaving}
            />
            <SettingToggle
              label="Apple OAuth"
              description="Enable Sign In with Apple for user authentication. Not yet implemented."
              enabled={settings?.appleOAuthEnabled ?? false}
              onChange={(value) =>
                handleOAuthToggleChange("Apple", "appleOAuthEnabled", value)
              }
              disabled={isSaving}
            />
          </SettingsSection>

          {/* Advertising Settings Section */}
          <SettingsSection
            title="Advertising Settings"
            description="Configure Google AdSense for non-intrusive ads. Bronze+ Patreon supporters never see ads. See GOOGLE_ADSENSE_SETUP.md for setup instructions."
            defaultExpanded={false}
          >
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
              <p className="text-blue-200 text-sm">
                <strong>Note:</strong> Ads are automatically hidden for Bronze+
                Patreon supporters (ad-free benefit). All ad placements are
                unobtrusive and won&apos;t interrupt reading.
              </p>
            </div>

            <SettingToggle
              label="Enable Ads"
              description="Master toggle for all advertising on the site. When disabled, no ads will be shown to anyone."
              enabled={settings?.adsEnabled ?? false}
              onChange={(value) => handleToggleChange("adsEnabled", value)}
              disabled={isSaving}
            />

            <SettingInput
              label="AdSense Publisher ID"
              description="Your Google AdSense Publisher ID (e.g., ca-pub-1234567890123456). Get this from your AdSense dashboard."
              value={settings?.adsensePublisherId ?? ""}
              onChange={(value) =>
                handleToggleChange("adsensePublisherId", value)
              }
              placeholder="ca-pub-XXXXXXXXXXXXXX"
              disabled={isSaving}
            />

            <SettingInput
              label="AdSense Verification Code (Optional)"
              description="Site verification code from Google AdSense, if required for site approval."
              value={settings?.adsenseVerificationCode ?? ""}
              onChange={(value) =>
                handleToggleChange("adsenseVerificationCode", value)
              }
              placeholder="Enter verification code"
              disabled={isSaving}
            />

            <div className="border-t border-gray-700 mt-4 pt-4">
              <h4 className="text-white font-medium mb-2">Ad Unit IDs</h4>
              <p className="text-gray-400 text-sm mb-4">
                Ad unit IDs from your AdSense dashboard. Leave empty to show
                Patreon support messages instead.
              </p>

              <SettingInput
                label="Homepage Ad Slot ID (Optional)"
                description="AdSense ad unit ID for homepage ads (e.g., 1234567890)."
                value={settings?.homepageAdSlot ?? ""}
                onChange={(value) =>
                  handleToggleChange("homepageAdSlot", value)
                }
                placeholder="Enter ad slot ID"
                disabled={isSaving}
              />

              <SettingInput
                label="Story End Ad Slot ID (Optional)"
                description="AdSense ad unit ID for story end ads (e.g., 1234567890)."
                value={settings?.storyEndAdSlot ?? ""}
                onChange={(value) =>
                  handleToggleChange("storyEndAdSlot", value)
                }
                placeholder="Enter ad slot ID"
                disabled={isSaving}
              />

              <SettingInput
                label="Footer Ad Slot ID (Optional)"
                description="AdSense ad unit ID for footer ads (e.g., 1234567890)."
                value={settings?.footerAdSlot ?? ""}
                onChange={(value) => handleToggleChange("footerAdSlot", value)}
                placeholder="Enter ad slot ID"
                disabled={isSaving}
              />
            </div>

            <div className="border-t border-gray-700 mt-4 pt-4">
              <h4 className="text-white font-medium mb-2">
                Ad Placement Controls
              </h4>
              <p className="text-gray-400 text-sm mb-4">
                Choose where ads appear on the site. All placements respect
                Patreon supporter status.
              </p>

              <SettingToggle
                label="Show Ads on Homepage"
                description="Display ads between story listings on the homepage (after every 3rd story)."
                enabled={settings?.showAdsOnHomepage ?? false}
                onChange={(value) =>
                  handleToggleChange("showAdsOnHomepage", value)
                }
                disabled={isSaving || !settings?.adsEnabled}
              />

              <SettingToggle
                label="Show Ads at Story End"
                description="Display ads after completing a chapter, before branch selection."
                enabled={settings?.showAdsOnStoryEnd ?? false}
                onChange={(value) =>
                  handleToggleChange("showAdsOnStoryEnd", value)
                }
                disabled={isSaving || !settings?.adsEnabled}
              />

              <SettingToggle
                label="Show Ads in Footer"
                description="Display ads at the bottom of long-form pages."
                enabled={settings?.showAdsInFooter ?? false}
                onChange={(value) =>
                  handleToggleChange("showAdsInFooter", value)
                }
                disabled={isSaving || !settings?.adsEnabled}
              />
            </div>
          </SettingsSection>

          {/* Patreon Configuration Section */}
          <SettingsSection
            title="Patreon Configuration"
            description="Configure Patreon integration settings. These credentials are stored securely in AWS Secrets Manager and encrypted both in transit (HTTPS) and at rest (KMS)."
            defaultExpanded={false}
          >
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
              <p className="text-blue-200 text-sm">
                <strong>Security:</strong> These values are directly synced to
                AWS Secrets Manager. Sensitive fields are masked after saving.
                Changes are applied immediately and used by all Patreon
                integration functions.
              </p>
            </div>

            <SettingInput
              label="Patreon Campaign ID"
              description="Your Patreon campaign ID. Found in your Patreon creator dashboard URL or API."
              value={patreonSecrets?.campaignId ?? ""}
              onChange={(value) =>
                handlePatreonSecretChange("campaignId", value)
              }
              placeholder="1234567"
              disabled={isSaving}
            />

            <SettingInput
              label="Patreon Client ID"
              description="OAuth Client ID from your Patreon app. Get this from https://www.patreon.com/portal/registration/register-clients"
              value={patreonSecrets?.clientId ?? ""}
              onChange={(value) => handlePatreonSecretChange("clientId", value)}
              placeholder="abc123def456..."
              disabled={isSaving}
            />

            <SettingInput
              label="Patreon Client Secret"
              description="OAuth Client Secret from your Patreon app. Keep this secret!"
              value={patreonSecrets?.clientSecret ?? ""}
              onChange={(value) =>
                handlePatreonSecretChange("clientSecret", value)
              }
              placeholder="xyz789uvw012..."
              type="password"
              disabled={isSaving}
            />

            <SettingInput
              label="Patreon Creator Access Token"
              description="Creator access token for API access. Generate this from your Patreon app settings."
              value={patreonSecrets?.creatorAccessToken ?? ""}
              onChange={(value) =>
                handlePatreonSecretChange("creatorAccessToken", value)
              }
              placeholder="Enter creator access token"
              type="password"
              disabled={isSaving}
            />

            <SettingInput
              label="Patreon Webhook Secret"
              description="Webhook secret for verifying webhook authenticity. Set this when creating your webhook in Patreon."
              value={patreonSecrets?.webhookSecret ?? ""}
              onChange={(value) =>
                handlePatreonSecretChange("webhookSecret", value)
              }
              placeholder="Enter webhook secret"
              type="password"
              disabled={isSaving}
            />
          </SettingsSection>

          {/* Google OAuth Configuration Section */}
          <SettingsSection
            title="Google OAuth Configuration"
            description="Configure Google Sign-In credentials for user authentication. These credentials are stored securely in AWS Secrets Manager and encrypted both in transit (HTTPS) and at rest (KMS)."
            defaultExpanded={false}
          >
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
              <p className="text-blue-200 text-sm">
                <strong>Security:</strong> These values are directly synced to
                AWS Secrets Manager. Sensitive fields are masked after saving.
                Changes are applied immediately and used by the Cognito User
                Pool for Google OAuth authentication.
              </p>
              <p className="text-blue-200 text-sm mt-2">
                <strong>Setup:</strong> Get these credentials from{" "}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-100"
                >
                  Google Cloud Console
                </a>
                . Create an OAuth 2.0 Client ID for a web application.
              </p>
            </div>

            <SettingInput
              label="Google OAuth Client ID"
              description="The Client ID from your Google Cloud OAuth 2.0 credentials. Looks like: 123456789-abcdef.apps.googleusercontent.com"
              value={googleOAuthSecrets?.clientId ?? ""}
              onChange={(value) =>
                handleGoogleOAuthSecretChange("clientId", value)
              }
              placeholder="123456789-abcdef.apps.googleusercontent.com"
              disabled={isSaving}
            />

            <SettingInput
              label="Google OAuth Client Secret"
              description="The Client Secret from your Google Cloud OAuth 2.0 credentials. Keep this secret!"
              value={googleOAuthSecrets?.clientSecret ?? ""}
              onChange={(value) =>
                handleGoogleOAuthSecretChange("clientSecret", value)
              }
              placeholder="GOCSPX-..."
              type="password"
              disabled={isSaving}
            />
          </SettingsSection>

          {/* Facebook OAuth Configuration Section */}
          <SettingsSection
            title="Facebook OAuth Configuration"
            description="Configure Facebook Sign-In credentials for user authentication. These credentials are stored securely in AWS Secrets Manager and encrypted both in transit (HTTPS) and at rest (KMS)."
            defaultExpanded={false}
          >
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
              <p className="text-blue-200 text-sm">
                <strong>Security:</strong> These values are directly synced to
                AWS Secrets Manager. Sensitive fields are masked after saving.
                Changes are applied immediately and used by the Cognito User
                Pool for Facebook OAuth authentication.
              </p>
              <p className="text-blue-200 text-sm mt-2">
                <strong>Setup:</strong> Get these credentials from{" "}
                <a
                  href="https://developers.facebook.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-100"
                >
                  Facebook Developers
                </a>
                . Create a Facebook App with Facebook Login configured. See{" "}
                <a
                  href="/FACEBOOK_OAUTH_SETUP.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-100"
                >
                  FACEBOOK_OAUTH_SETUP.md
                </a>{" "}
                for detailed step-by-step instructions.
              </p>
            </div>

            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
              <h4 className="text-white font-semibold mb-3">
                Facebook App Configuration Reference
              </h4>
              <p className="text-gray-400 text-sm mb-3">
                These values should be configured in your Facebook App Settings
                (Settings → Basic). They are listed here for reference.
              </p>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400">Display Name:</span>{" "}
                    <span className="text-white">The Story Hub</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Namespace:</span>{" "}
                    <span className="text-white">the-story-hub</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">App Domains:</span>{" "}
                  <span className="text-white">
                    d32h8ny4vmj7kl.cloudfront.net
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Privacy Policy URL:</span>{" "}
                  <a
                    href="https://d32h8ny4vmj7kl.cloudfront.net/legal/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    https://d32h8ny4vmj7kl.cloudfront.net/legal/privacy/
                  </a>
                </div>
                <div>
                  <span className="text-gray-400">Terms of Service URL:</span>{" "}
                  <a
                    href="https://d32h8ny4vmj7kl.cloudfront.net/legal/terms/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    https://d32h8ny4vmj7kl.cloudfront.net/legal/terms/
                  </a>
                </div>
                <div>
                  <span className="text-gray-400">
                    Data Deletion Callback URL:
                  </span>{" "}
                  <span className="text-white">
                    https://pvey1gnejj.execute-api.ap-southeast-2.amazonaws.com/dev/facebook/data-deletion
                  </span>
                </div>
              </div>
            </div>

            <SettingInput
              label="Facebook OAuth Client ID"
              description="The App ID from your Facebook App settings. This is a numeric ID."
              value={facebookOAuthSecrets?.clientId ?? ""}
              onChange={(value) =>
                handleFacebookOAuthSecretChange("clientId", value)
              }
              placeholder="1234567890123456"
              disabled={isSaving}
            />

            <SettingInput
              label="Facebook OAuth Client Secret"
              description="The App Secret from your Facebook App settings. Keep this secret!"
              value={facebookOAuthSecrets?.clientSecret ?? ""}
              onChange={(value) =>
                handleFacebookOAuthSecretChange("clientSecret", value)
              }
              placeholder="Enter your Facebook App Secret"
              type="password"
              disabled={isSaving}
            />
          </SettingsSection>

          {/* Future Settings Sections Can Be Added Here */}
          {/*
          <SettingsSection
            title="General Settings"
            description="Basic site configuration"
          >
            <SettingToggle
              label="Maintenance Mode"
              description="When enabled, the site will show a maintenance message to non-admin users"
              enabled={settings?.maintenanceMode ?? false}
              onChange={(value) => handleToggleChange("maintenanceMode", value)}
              disabled={isSaving}
            />
          </SettingsSection>
          */}

          {/* Settings Metadata */}
          {settings && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-400">
              <div className="space-y-1">
                <p>
                  <span className="font-medium">Last Updated:</span>{" "}
                  {new Date(settings.updatedAt).toLocaleString()}
                </p>
                {settings.updatedBy && (
                  <p>
                    <span className="font-medium">Updated By:</span>{" "}
                    {settings.updatedBy}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Facebook OAuth Redeploy Reminder Modal */}
      {showFacebookRedeployModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Redeploy Required
            </h2>
            <div className="space-y-4 text-gray-300">
              <p>
                Your Facebook OAuth credentials have been saved to AWS Secrets
                Manager. To complete the setup, you need to redeploy the stack.
              </p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-400 mb-2">
                  Run this command:
                </p>
                <code className="text-green-400 text-sm">
                  yarn deploy:tsh:dev:update
                </code>
              </div>
              <p className="text-sm text-gray-400">
                The deployment will update the Cognito Identity Provider to use
                your Facebook OAuth credentials for authentication.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFacebookRedeployModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OAuth Implementation Status Modal */}
      {showOAuthStatusModal && oauthStatusModalData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              {oauthStatusModalData.provider} OAuth Status
            </h2>
            <div className="space-y-4 text-gray-300">
              <p className="text-lg">
                {oauthStatusModalData.enabled ? "Enabled" : "Disabled"}
              </p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-400 mb-2">
                  Implementation Status:
                </p>
                <p className="text-gray-300">{oauthStatusModalData.status}</p>
              </div>
              {oauthStatusModalData.provider === "Facebook" && (
                <p className="text-sm text-gray-400">
                  For detailed setup instructions, see FACEBOOK_OAUTH_SETUP.md
                  in the project root.
                </p>
              )}
              {oauthStatusModalData.enabled && (
                <p className="text-sm text-gray-400">
                  The {oauthStatusModalData.provider} OAuth button will now
                  appear on the login/registration modal.
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowOAuthStatusModal(false);
                  setOAuthStatusModalData(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <RequireAdmin>
      <AdminSettingsContent />
    </RequireAdmin>
  );
}
