"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-green to-brand-lime py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            About Lawn Order
          </h1>
          <p className="text-xl text-white/90">
            Your trusted partner in lawn care and landscaping excellence
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-brand-green mb-6 text-center">
            Our Story
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-4">
              Lawn Order was founded with a simple mission: to provide
              exceptional lawn care and landscaping services that transform
              outdoor spaces into beautiful, healthy environments.
            </p>
            <p className="mb-4">
              With years of experience in the industry, our team of dedicated
              professionals brings expertise, passion, and attention to detail
              to every project. We understand that your lawn is more than just
              grass – it's an extension of your home and a reflection of your
              care.
            </p>
            <p>
              From routine maintenance to complete landscape transformations,
              we're committed to exceeding your expectations and creating
              outdoor spaces you'll love.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-brand-green mb-12 text-center">
            Why Choose Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-lime rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">🌟</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-green mb-3 text-center">
                Quality Service
              </h3>
              <p className="text-gray-700 text-center">
                We use professional-grade equipment and techniques to deliver
                outstanding results
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-lime rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">🌱</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-green mb-3 text-center">
                Eco-Friendly
              </h3>
              <p className="text-gray-700 text-center">
                Sustainable practices that protect your lawn and the environment
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-lime rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">💚</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-green mb-3 text-center">
                Customer First
              </h3>
              <p className="text-gray-700 text-center">
                Your satisfaction is our priority, backed by our service
                guarantee
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-green">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Lawn?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Contact us today for a free consultation and quote
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-white text-brand-green font-semibold"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
