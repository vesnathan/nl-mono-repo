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
            About Loud'n'Clear Digital
          </h1>
          <p className="text-xl text-white/90">
            Your trusted partner in digital transformation and online growth
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
              Loud'n'Clear Digital was founded with a simple mission: to help
              businesses thrive in the digital age through strategic, innovative
              solutions that drive real results.
            </p>
            <p className="mb-4">
              With years of experience in web development, digital marketing, and
              social media management, our team brings expertise, creativity, and
              dedication to every project. We understand that your online presence
              is more than just a website – it's your digital storefront, your
              brand voice, and a key driver of business growth.
            </p>
            <p>
              From building custom websites to managing comprehensive social media
              campaigns, we're committed to exceeding expectations and creating
              digital experiences that connect with your audience and drive
              meaningful engagement.
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
                <span className="text-3xl">💻</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-green mb-3 text-center">
                Modern Technology
              </h3>
              <p className="text-gray-700 text-center">
                We use cutting-edge technologies and frameworks to deliver
                fast, secure, and scalable digital solutions
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-lime rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-green mb-3 text-center">
                Data-Driven Strategy
              </h3>
              <p className="text-gray-700 text-center">
                Strategic approaches backed by analytics and insights to ensure
                measurable results and ROI
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="w-16 h-16 bg-brand-lime rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-brand-green mb-3 text-center">
                Partnership Approach
              </h3>
              <p className="text-gray-700 text-center">
                We don't just deliver projects – we partner with you for
                long-term success and ongoing support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-green">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Digital Presence?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Contact us today for a free consultation and custom quote
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
