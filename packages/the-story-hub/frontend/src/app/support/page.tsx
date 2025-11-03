"use client";

import { Card, CardBody, CardHeader, Button, Chip } from "@nextui-org/react";
import Link from "next/link";

export default function SupportUsPage() {
  const universalBenefits = [
    '"Early Supporter" badge on profile and contributions',
    "Listed on 'Founding Patrons' page",
  ];

  const tiers = [
    {
      name: "Early Access",
      price: "$3-5",
      color: "primary",
      benefits: [
        "Patreon Supporter badge on profile and stories",
        "Recognition on supporters page",
        "Early access to new features before public release",
        "Beta testing opportunities",
        "Vote on feature priorities",
        "Behind-the-scenes development updates",
        "Priority response to bug reports and feature requests",
        "Monthly poll participation on what to build next",
      ],
    },
    {
      name: "Creator",
      price: "$5-10",
      color: "secondary",
      popular: true,
      benefits: [
        "All Early Access benefits, plus:",
        "Priority placement for featured stories",
        "Analytics dashboard for your stories (views, engagement metrics)",
        "Ability to pin comments on your stories",
      ],
    },
    {
      name: "Premium",
      price: "$10-15",
      color: "warning",
      benefits: [
        "All Creator benefits, plus:",
        "Custom public profile page highlighting your contributions and discussions",
        "Monthly spotlight feature for one of your stories",
        "Direct messaging with other patrons",
        "Story export: Download stories in ePub/PDF format",
        "Advanced moderation: Tools to better manage your story communities",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Support The Story Hub
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Help us build the future of interactive storytelling. Your support
            keeps the platform running and enables us to develop amazing new
            features for the community.
          </p>
          <Button
            as={Link}
            href="https://patreon.com/thestoryhub"
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600"
          >
            Become a Patron
          </Button>
        </div>

        {/* Why Support Section */}
        <Card className="bg-gray-800 border border-gray-700 mb-12">
          <CardHeader>
            <h2 className="text-2xl font-bold text-white">
              Why Your Support Matters
            </h2>
          </CardHeader>
          <CardBody>
            <div className="grid md:grid-cols-3 gap-6 text-gray-300">
              <div>
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Platform Development
                </h3>
                <p>
                  Your contributions fund new features, improvements, and the
                  infrastructure that keeps The Story Hub running smoothly.
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">👥</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Community Growth
                </h3>
                <p>
                  Help us grow a vibrant community of writers and readers who
                  love interactive, branching narratives.
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">✨</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Creator Tools
                </h3>
                <p>
                  Support the development of advanced analytics, writing tools,
                  and features that empower storytellers.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Universal Benefits Section */}
        <div className="mb-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            Our first Patrons Receive
          </h2>
          <ul className="space-y-3">
            {universalBenefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center justify-center text-gray-300"
              >
                <span className="text-purple-400 mr-3 text-lg">✓</span>
                <span className="text-lg">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 items-stretch">
          {tiers.map((tier) => (
            <div key={tier.name} className="relative">
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  <Chip color="secondary" variant="solid" size="sm">
                    Most Popular
                  </Chip>
                </div>
              )}
              <Card
                className={`bg-gray-800 border ${
                  tier.popular
                    ? "border-purple-500 ring-2 ring-purple-500"
                    : "border-gray-700"
                } flex flex-col h-full`}
              >
                <CardHeader className="flex-col items-start pb-4 pt-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-3xl font-bold text-purple-400 mb-4">
                    {tier.price}
                    <span className="text-sm text-gray-400">/month</span>
                  </p>
                </CardHeader>
                <CardBody className="flex flex-col flex-grow">
                  <ul className="space-y-3 mb-6 flex-grow">
                    {tier.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className={`flex items-start text-gray-300 ${
                          benefit.startsWith("All ") ? "font-semibold" : ""
                        }`}
                      >
                        <span className="text-green-400 mr-2 mt-1">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    as={Link}
                    href="https://patreon.com/thestoryhub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full ${
                      tier.popular
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-gray-700 hover:bg-gray-600"
                    } text-white`}
                  >
                    Choose {tier.name}
                  </Button>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="bg-gray-800 border border-gray-700">
          <CardHeader>
            <h2 className="text-2xl font-bold text-white">
              Frequently Asked Questions
            </h2>
          </CardHeader>
          <CardBody className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p>
                Yes! You can cancel your Patreon subscription at any time. Your
                benefits will remain active until the end of your billing
                period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                When do I get my benefits?
              </h3>
              <p>
                Most benefits (like badges and early access) are activated
                immediately upon becoming a patron. Some benefits like featured
                story placement are on a monthly rotation.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                How do I access the Discord?
              </h3>
              <p>
                Once you become a patron, you&apos;ll receive a Discord invite
                link via Patreon. This gives you access to patron-only channels
                and direct communication with the development team.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What if I have other questions?
              </h3>
              <p>
                Feel free to reach out via our{" "}
                <Link
                  href="/legal/contact"
                  className="text-purple-400 hover:underline"
                >
                  contact page
                </Link>{" "}
                or message us directly on Patreon!
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-xl text-gray-300 mb-6">
            Ready to support interactive storytelling?
          </p>
          <Button
            as={Link}
            href="https://patreon.com/thestoryhub"
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600"
          >
            Join on Patreon
          </Button>
        </div>
      </div>
    </div>
  );
}
