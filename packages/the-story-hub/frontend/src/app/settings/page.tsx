"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Chip } from "@nextui-org/react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

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

export default function SettingsPage() {
  const { user, userId, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [patreonStatus, setPatreonStatus] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <LoadingSpinner label="Loading settings..." />
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  const patreonTier = user.patreonInfo?.tier;
  const isConnected = patreonTier && patreonTier !== "NONE";
  const tierConfig =
    patreonTier && PATREON_TIERS[patreonTier as keyof typeof PATREON_TIERS];

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-12">
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
                  <span className="text-gray-400">Status:</span>
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
                      <span className="text-gray-400">{tier.price}</span>
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
          <CardBody className="p-6 space-y-3">
            <div>
              <span className="text-gray-400">Username: </span>
              <span className="text-white">{user.username}</span>
            </div>
            <div>
              <span className="text-gray-400">Email: </span>
              <span className="text-white">{user.email}</span>
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
      </div>
    </div>
  );
}
