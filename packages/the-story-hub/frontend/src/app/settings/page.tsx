"use client";

/* eslint-disable sonarjs/cognitive-complexity */

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Textarea,
  Switch,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useUserStore } from "@/stores/userStore";
import { RequireAuth } from "@/components/common/RequireAuth";
import {
  ProfileVisibility,
  NotificationFrequency,
  AgeRating,
} from "@/types/ValidationSchemas";

// CSS class constants
const TEXT_GRAY_400 = "text-gray-400";
const TEXT_SM_GRAY_400 = "text-sm text-gray-400";
const LABEL_TEXT_GRAY_400 = "text-sm font-medium text-gray-400";
const TEXT_WHITE = "text-white";
const BG_GRAY_700 = "bg-gray-700";
const TRIGGER_BG = "bg-gray-800 border-gray-700";

// Patreon tier configuration
const PATREON_TIERS = {
  BRONZE: {
    name: "Bronze Supporter",
    color: "bg-amber-700",
    price: "$3/month",
  },
  SILVER: { name: "Silver Supporter", color: "bg-gray-400", price: "$5/month" },
  GOLD: { name: "Gold Supporter", color: "bg-yellow-500", price: "$10/month" },
  PLATINUM: {
    name: "Platinum Supporter",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    price: "$20/month",
  },
};

function SettingsContent() {
  const { userId } = useAuth();
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patreonStatus, setPatreonStatus] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedBio, setEditedBio] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Settings editing state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: ProfileVisibility.PUBLIC,
    showStats: true,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    notifyOnReply: true,
    notifyOnUpvote: true,
    notifyOnStoryUpdate: true,
    notificationFrequency: NotificationFrequency.IMMEDIATELY,
  });
  const [contentSettings, setContentSettings] = useState({
    defaultAgeRatingFilter: AgeRating.M,
    hideAIContent: false,
    autoSaveEnabled: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Initialize edit form and settings when user data loads
  useEffect(() => {
    if (user && user.userId) {
      setEditedBio(user.bio || "");

      // Initialize privacy settings
      if (user.privacySettings) {
        setPrivacySettings({
          profileVisibility: user.privacySettings.profileVisibility,
          showStats: user.privacySettings.showStats,
        });
      }

      // Initialize notification settings
      if (user.notificationSettings) {
        setNotificationSettings({
          emailNotifications: user.notificationSettings.emailNotifications,
          notifyOnReply: user.notificationSettings.notifyOnReply,
          notifyOnUpvote: user.notificationSettings.notifyOnUpvote,
          notifyOnStoryUpdate: user.notificationSettings.notifyOnStoryUpdate,
          notificationFrequency:
            user.notificationSettings.notificationFrequency,
        });
      }

      // Initialize content settings
      if (user.contentSettings) {
        setContentSettings({
          defaultAgeRatingFilter: user.contentSettings.defaultAgeRatingFilter,
          hideAIContent: user.contentSettings.hideAIContent,
          autoSaveEnabled: user.contentSettings.autoSaveEnabled,
        });
      }
    }
  }, [user]);

  // Check for OAuth callback status
  useEffect(() => {
    const status = searchParams?.get("patreon");
    const tier = searchParams?.get("tier");

    if (status === "success") {
      setPatreonStatus(
        `Successfully connected! Your tier: ${tier || "Unknown"}`,
      );
      // Clear query params
      router.replace("/settings");
    } else if (status === "error") {
      const message = searchParams?.get("message");
      setPatreonStatus(`Connection failed: ${message || "Unknown error"}`);
    }
  }, [searchParams, router]);

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setEditedBio(user.bio || "");
    setIsEditingProfile(false);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    setIsSavingProfile(true);
    try {
      // TODO: Call updateUserProfile mutation
      // For now, just simulate success (functionality coming soon)
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!userId) return;

    setIsSavingSettings(true);
    try {
      // TODO: Call updateUserSettings mutation
      // For now, just simulate success (functionality coming soon)
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleConnectPatreon = async () => {
    if (!userId) return;

    setIsConnecting(true);

    // Get API URL from environment
    const apiUrl =
      process.env.NEXT_PUBLIC_GRAPHQL_URL?.replace("/graphql", "") || "";
    const oauthUrl = `${apiUrl}/auth/patreon?userId=${userId}`;

    // Redirect to OAuth flow
    window.location.href = oauthUrl;
  };

  // User store might not be loaded yet, show loading
  if (!user || !user.userId) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner label="Loading user data..." />
      </div>
    );
  }

  const patreonTier = user.patreonInfo?.tier;
  const isConnected = patreonTier && patreonTier !== "NONE";
  const tierConfig =
    patreonTier && PATREON_TIERS[patreonTier as keyof typeof PATREON_TIERS];

  return (
    <div className="bg-[#1a1a1a] py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Account Settings</h1>

        {/* Patreon Connection Card */}
        <Card className="bg-gray-900 border border-gray-700 mb-6">
          <CardHeader className="border-b border-gray-700">
            <div className="flex items-center gap-3">
              <svg
                className="w-8 h-8 text-[#FF424D]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
              </svg>
              <h2 className="text-2xl font-bold text-white">
                Patreon Integration
              </h2>
            </div>
          </CardHeader>
          <CardBody className="p-6">
            {patreonStatus && (
              <div
                className={`mb-4 p-3 rounded ${patreonStatus.includes("Success") ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
              >
                {patreonStatus}
              </div>
            )}

            {isConnected && tierConfig ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={TEXT_GRAY_400}>Status:</span>
                  <Chip
                    className={`${tierConfig.color} text-white font-semibold`}
                    size="lg"
                  >
                    {tierConfig.name} ({tierConfig.price})
                  </Chip>
                </div>

                <div className="bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-2">
                    Your Benefits:
                  </h3>
                  <ul className="text-gray-300 space-y-1 list-disc list-inside">
                    {patreonTier === "BRONZE" && (
                      <li>Ad-free experience across the site</li>
                    )}
                    {(patreonTier === "SILVER" ||
                      patreonTier === "GOLD" ||
                      patreonTier === "PLATINUM") && (
                      <>
                        <li>Ad-free experience</li>
                        <li>Early access to new features</li>
                      </>
                    )}
                    {(patreonTier === "GOLD" || patreonTier === "PLATINUM") && (
                      <li>Exclusive Discord role and access</li>
                    )}
                    {patreonTier === "PLATINUM" && (
                      <>
                        <li>Vote on new feature development</li>
                        <li>
                          Display your Patreon creator page link on your profile
                          & contributions
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <p className="text-gray-400 text-sm">
                  Your Patreon account is connected. Tier updates sync
                  automatically!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-300">
                  Connect your Patreon account to unlock exclusive benefits and
                  support The Story Hub!
                </p>

                <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                  <h3 className="text-white font-semibold mb-3">
                    Available Tiers:
                  </h3>
                  {Object.entries(PATREON_TIERS).map(([key, tier]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 border-b border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                        <span className="text-white font-medium">
                          {tier.name}
                        </span>
                      </div>
                      <span className={TEXT_GRAY_400}>{tier.price}</span>
                    </div>
                  ))}
                </div>

                <Button
                  color="primary"
                  size="lg"
                  onPress={handleConnectPatreon}
                  isLoading={isConnecting}
                  className="w-full bg-[#FF424D] hover:bg-[#E03A46]"
                  startContent={
                    !isConnecting && (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003" />
                      </svg>
                    )
                  }
                >
                  {isConnecting ? "Connecting..." : "Connect with Patreon"}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Account Info Card */}
        <Card className="bg-gray-900 border border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Account Info</h2>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            <div>
              <span className={TEXT_GRAY_400}>Username: </span>
              <span className="text-white">{user.username}</span>
            </div>
            <div>
              <span className={TEXT_GRAY_400}>Email: </span>
              <span className="text-white">{user.email}</span>
            </div>
            <div>
              <span className={TEXT_GRAY_400}>Account Created: </span>
              <span className="text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user.ogSupporter && (
              <div>
                <Chip color="warning" size="sm">
                  ⭐ OG Supporter
                </Chip>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Profile Settings Card - SILVER+ tier */}
        <Card className="bg-gray-900 border border-gray-700 mt-6">
          <CardHeader className="border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
            {!isEditingProfile &&
              patreonTier &&
              ["SILVER", "GOLD", "PLATINUM"].includes(patreonTier) && (
                <Button
                  size="sm"
                  className="bg-[#422F9F] hover:bg-[#2162BF] text-white"
                  onPress={handleEditProfile}
                >
                  Edit Profile
                </Button>
              )}
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            {patreonTier &&
            ["SILVER", "GOLD", "PLATINUM"].includes(patreonTier) ? (
              isEditingProfile ? (
                <>
                  <Textarea
                    label="Bio"
                    placeholder="Tell us about yourself..."
                    value={editedBio}
                    onValueChange={setEditedBio}
                    maxLength={500}
                    classNames={{
                      input: TEXT_WHITE,
                      label: LABEL_TEXT_GRAY_400,
                    }}
                  />
                  <Input
                    label="Favorite Authors"
                    placeholder="Comma-separated list of your favorite authors"
                    classNames={{
                      input: TEXT_WHITE,
                      label: LABEL_TEXT_GRAY_400,
                    }}
                  />
                  <Input
                    label="Interests/Tags"
                    placeholder="e.g., Fantasy, Sci-Fi, Mystery"
                    classNames={{
                      input: TEXT_WHITE,
                      label: LABEL_TEXT_GRAY_400,
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      color="primary"
                      onPress={handleSaveProfile}
                      isLoading={isSavingProfile}
                      className="bg-[#422F9F] hover:bg-[#2162BF]"
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="bordered"
                      onPress={handleCancelEdit}
                      isDisabled={isSavingProfile}
                      className="border-gray-600 text-white hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className={TEXT_GRAY_400}>Bio: </span>
                    {user.bio ? (
                      <span className="text-white">{user.bio}</span>
                    ) : (
                      <span className="text-gray-500 italic">
                        No bio yet. Click &ldquo;Edit Profile&rdquo; to add one.
                      </span>
                    )}
                  </div>
                  <div>
                    <span className={TEXT_GRAY_400}>Favorite Authors: </span>
                    <span className="text-gray-500 italic">
                      Not set. Click &ldquo;Edit Profile&rdquo; to add.
                    </span>
                  </div>
                  <div>
                    <span className={TEXT_GRAY_400}>Interests: </span>
                    <span className="text-gray-500 italic">
                      Not set. Click &ldquo;Edit Profile&rdquo; to add.
                    </span>
                  </div>
                </>
              )
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-300 mb-3">
                  Profile customization is available for SILVER tier supporters
                  and above.
                </p>
                <ul className="text-gray-400 space-y-1 list-disc list-inside mb-3">
                  <li>Custom bio on your profile</li>
                  <li>Showcase favorite authors</li>
                  <li>Add interest tags</li>
                  <li>Profile page with activity & stats</li>
                </ul>
                <Button
                  color="primary"
                  size="sm"
                  onPress={handleConnectPatreon}
                  className="bg-[#FF424D] hover:bg-[#E03A46]"
                >
                  Upgrade to SILVER
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Privacy Settings Card - GOLD+ tier only */}
        <Card className="bg-gray-900 border border-gray-700 mt-6">
          <CardHeader className="border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">Privacy Settings</h2>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            {patreonTier && ["GOLD", "PLATINUM"].includes(patreonTier) ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Profile Visibility</p>
                    <p className={TEXT_SM_GRAY_400}>
                      Control who can see your profile
                    </p>
                  </div>
                  <Select
                    selectedKeys={[privacySettings.profileVisibility]}
                    onChange={(e) =>
                      setPrivacySettings({
                        ...privacySettings,
                        profileVisibility: e.target.value as ProfileVisibility,
                      })
                    }
                    className="w-40"
                    classNames={{
                      trigger: TRIGGER_BG,
                      value: TEXT_WHITE,
                    }}
                  >
                    <SelectItem
                      key={ProfileVisibility.PUBLIC}
                      value={ProfileVisibility.PUBLIC}
                    >
                      Public
                    </SelectItem>
                    <SelectItem
                      key={ProfileVisibility.PRIVATE}
                      value={ProfileVisibility.PRIVATE}
                    >
                      Private
                    </SelectItem>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Show Statistics</p>
                    <p className={TEXT_SM_GRAY_400}>
                      Display your stats on your profile
                    </p>
                  </div>
                  <Switch
                    isSelected={privacySettings.showStats}
                    onValueChange={(value) =>
                      setPrivacySettings({
                        ...privacySettings,
                        showStats: value,
                      })
                    }
                    classNames={{
                      wrapper: BG_GRAY_700,
                    }}
                  />
                </div>

                <Button
                  color="primary"
                  onPress={handleSaveSettings}
                  isLoading={isSavingSettings}
                  className="bg-[#422F9F] hover:bg-[#2162BF]"
                >
                  Save Privacy Settings
                </Button>
              </>
            ) : (
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-300 mb-3">
                  Privacy controls are available for GOLD tier supporters and
                  above:
                </p>
                <ul className="text-gray-400 space-y-1 list-disc list-inside mb-3">
                  <li>Set profile visibility to Public or Private</li>
                  <li>Choose whether to show statistics on your profile</li>
                  <li>Control who can see your activity and contributions</li>
                </ul>
                <Button
                  color="primary"
                  size="sm"
                  onPress={handleConnectPatreon}
                  className="bg-[#FF424D] hover:bg-[#E03A46]"
                >
                  Upgrade to GOLD
                </Button>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Notification Preferences Card */}
        <Card className="bg-gray-900 border border-gray-700 mt-6">
          <CardHeader className="border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">
              Notification Preferences
            </h2>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className={TEXT_SM_GRAY_400}>
                  Receive notifications via email
                </p>
              </div>
              <Switch
                isSelected={notificationSettings.emailNotifications}
                onValueChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailNotifications: value,
                  })
                }
                classNames={{
                  wrapper: BG_GRAY_700,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Notify on Reply</p>
                <p className={TEXT_SM_GRAY_400}>
                  When someone replies to your comment
                </p>
              </div>
              <Switch
                isSelected={notificationSettings.notifyOnReply}
                onValueChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    notifyOnReply: value,
                  })
                }
                classNames={{
                  wrapper: BG_GRAY_700,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Notify on Upvote</p>
                <p className={TEXT_SM_GRAY_400}>
                  When someone upvotes your contribution
                </p>
              </div>
              <Switch
                isSelected={notificationSettings.notifyOnUpvote}
                onValueChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    notifyOnUpvote: value,
                  })
                }
                classNames={{
                  wrapper: BG_GRAY_700,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Notify on Story Update</p>
                <p className={TEXT_SM_GRAY_400}>
                  When a story you follow is updated
                </p>
              </div>
              <Switch
                isSelected={notificationSettings.notifyOnStoryUpdate}
                onValueChange={(value) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    notifyOnStoryUpdate: value,
                  })
                }
                classNames={{
                  wrapper: BG_GRAY_700,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Notification Frequency</p>
                <p className={TEXT_SM_GRAY_400}>
                  How often you want to receive notifications
                </p>
              </div>
              <Select
                selectedKeys={[notificationSettings.notificationFrequency]}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    notificationFrequency: e.target
                      .value as NotificationFrequency,
                  })
                }
                className="w-48"
                classNames={{
                  trigger: TRIGGER_BG,
                  value: TEXT_WHITE,
                }}
              >
                <SelectItem
                  key={NotificationFrequency.IMMEDIATELY}
                  value={NotificationFrequency.IMMEDIATELY}
                >
                  Immediate
                </SelectItem>
                <SelectItem
                  key={NotificationFrequency.DAILY}
                  value={NotificationFrequency.DAILY}
                >
                  Daily Digest
                </SelectItem>
                <SelectItem
                  key={NotificationFrequency.WEEKLY}
                  value={NotificationFrequency.WEEKLY}
                >
                  Weekly Digest
                </SelectItem>
                <SelectItem
                  key={NotificationFrequency.NEVER}
                  value={NotificationFrequency.NEVER}
                >
                  Never
                </SelectItem>
              </Select>
            </div>

            <Button
              color="primary"
              onPress={handleSaveSettings}
              isLoading={isSavingSettings}
              className="bg-[#422F9F] hover:bg-[#2162BF]"
            >
              Save Notification Preferences
            </Button>
          </CardBody>
        </Card>

        {/* Content Preferences Card */}
        <Card className="bg-gray-900 border border-gray-700 mt-6">
          <CardHeader className="border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white">
              Content Preferences
            </h2>
          </CardHeader>
          <CardBody className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Age Rating Filter</p>
                <p className={TEXT_SM_GRAY_400}>
                  Default content filter for stories
                </p>
              </div>
              <Select
                selectedKeys={[contentSettings.defaultAgeRatingFilter]}
                onChange={(e) =>
                  setContentSettings({
                    ...contentSettings,
                    defaultAgeRatingFilter: e.target.value as AgeRating,
                  })
                }
                className="w-40"
                classNames={{
                  trigger: TRIGGER_BG,
                  value: TEXT_WHITE,
                }}
              >
                <SelectItem key={AgeRating.G} value={AgeRating.G}>
                  G (General Audiences)
                </SelectItem>
                <SelectItem key={AgeRating.PG} value={AgeRating.PG}>
                  PG (Parental Guidance)
                </SelectItem>
                <SelectItem key={AgeRating.PG_13} value={AgeRating.PG_13}>
                  PG-13 (Parents Strongly Cautioned)
                </SelectItem>
                <SelectItem key={AgeRating.M} value={AgeRating.M}>
                  M (Mature 17+)
                </SelectItem>
                <SelectItem
                  key={AgeRating.ADULT_18_PLUS}
                  value={AgeRating.ADULT_18_PLUS}
                >
                  Adult 18+
                </SelectItem>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Hide AI Content</p>
                <p className={TEXT_SM_GRAY_400}>
                  Hide AI-generated contributions from stories
                </p>
              </div>
              <Switch
                isSelected={contentSettings.hideAIContent}
                onValueChange={(value) =>
                  setContentSettings({
                    ...contentSettings,
                    hideAIContent: value,
                  })
                }
                classNames={{
                  wrapper: BG_GRAY_700,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-save</p>
                <p className={TEXT_SM_GRAY_400}>
                  Automatically save your drafts while writing
                </p>
              </div>
              <Switch
                isSelected={contentSettings.autoSaveEnabled}
                onValueChange={(value) =>
                  setContentSettings({
                    ...contentSettings,
                    autoSaveEnabled: value,
                  })
                }
                classNames={{
                  wrapper: BG_GRAY_700,
                }}
              />
            </div>

            <Button
              color="primary"
              onPress={handleSaveSettings}
              isLoading={isSavingSettings}
              className="bg-[#422F9F] hover:bg-[#2162BF]"
            >
              Save Content Preferences
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
