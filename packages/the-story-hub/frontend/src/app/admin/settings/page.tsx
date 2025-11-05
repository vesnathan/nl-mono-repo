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

// Reusable Components for Settings UI

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm mb-6">{description}</p>
      <div className="space-y-4">{children}</div>
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [settingsData, secretsData] = await Promise.all([
        getSiteSettingsAPI(),
        getPatreonSecretsAPI(),
      ]);
      setSettings(settingsData);
      setPatreonSecrets(secretsData);
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

          {/* Patreon Configuration Section */}
          <SettingsSection
            title="Patreon Configuration"
            description="Configure Patreon integration settings. These credentials are stored securely in AWS Secrets Manager and encrypted both in transit (HTTPS) and at rest (KMS)."
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
