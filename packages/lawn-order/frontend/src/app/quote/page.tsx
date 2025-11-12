"use client";

import { Suspense, useState, useEffect } from "react";
import { Button, Input, Textarea, Select, SelectItem, Checkbox } from "@nextui-org/react";
import { useSearchParams } from "next/navigation";
import { HeroSlider } from "@/components/HeroSlider";
import { AddressSection } from "@/components/AddressSection";
import ParallaxGap from "@/components/layout/ParallaxGap";

// reCAPTCHA site key - same as contact form
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const SERVICE_TYPES = [
  { value: "LAWN_MOWING", label: "Lawn Mowing" },
  { value: "WHIPPER_SNIPPERING", label: "Whipper Snippering" },
  { value: "GROUND_PRUNING", label: "Ground Level Pruning" },
  { value: "WASTE_REMOVAL", label: "Garden Waste Removal" },
  { value: "GUTTER_CLEANING", label: "Gutter Cleaning" },
  { value: "PRESSURE_WASHING", label: "Pressure Washing" },
  { value: "PACKAGE", label: "Full Property Package" },
  { value: "OTHER", label: "Other - Please Describe" },
];

const RENTAL_PLATFORMS = [
  { value: "AIRBNB", label: "Airbnb" },
  { value: "BOOKING_COM", label: "Booking.com" },
  { value: "VRBO", label: "VRBO / Stayz" },
  { value: "MULTIPLE", label: "Multiple Platforms" },
  { value: "OTHER", label: "Other" },
];

function ContactForm() {
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);

  useEffect(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setRecaptchaLoaded(true);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector(`script[src*="recaptcha"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);

    try {
      // Get reCAPTCHA token
      let recaptchaToken = '';
      if (recaptchaLoaded && window.grecaptcha) {
        recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'quote_form' });
      }

      // Build data object from form
      const data: any = {
        formType: 'quote',
        recaptchaToken,
      };

      // Add all form fields
      formData.forEach((value, key) => {
        data[key] = value;
      });

      if (preselectedService) {
        data.preselected_service = preselectedService;
      }

      const response = await fetch('https://2pqtprxtj6zdhu7f52nitgp6ky0gwuvp.lambda-url.ap-southeast-2.on.aws/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSubmitStatus('success');
        (e.target as HTMLFormElement).reset();
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Address/Contact Section */}
      <AddressSection />

      {/* Contact Form in Parallax Gap */}
      <ParallaxGap
        image="/images/hero-pool-garden.png"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.85) 100%)"
      >
        <section className="py-20 w-full">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4 font-josefin">Get a Free Quote</h2>
                <div className="w-16 h-1 bg-brand-green mb-6 mx-auto"></div>
                <p className="text-xl text-white/90 font-roboto-slab mb-2">
                  For Airbnb, Booking.com & VRBO Properties in Devonport Area
                </p>
                <p className="text-white/80 font-roboto-slab">
                  Postcodes 7310 & 7306
                </p>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8">
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg font-roboto-slab">
                    Thank you! Your quote request has been received. We'll get back to you within 24 hours with a custom quote for your property.
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg font-roboto-slab">
                    Sorry, there was an error submitting your quote request. Please try again or email us directly at service@tommyslawnorder.com.au
                  </div>
                )}

                <div className="mb-8 p-4 bg-brand-green/10 rounded-lg border-2 border-brand-green/30">
                  <p className="text-gray-700 text-center font-roboto-slab">
                    <strong className="text-brand-green font-josefin">Holiday Rental Hosts:</strong> We know you need reliable service between guest bookings.
                    Tell us about your property and we'll provide a custom quote.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-semibold text-brand-green mb-4 font-josefin">Your Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    placeholder="John"
                    required
                    size="lg"
                    classNames={{
                      input: "font-roboto-slab",
                      label: "font-roboto-slab",
                    }}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    placeholder="Smith"
                    required
                    size="lg"
                    classNames={{
                      input: "font-roboto-slab",
                      label: "font-roboto-slab",
                    }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <Input
                    type="email"
                    label="Email"
                    name="email"
                    placeholder="john@example.com"
                    required
                    size="lg"
                    classNames={{
                      input: "font-roboto-slab",
                      label: "font-roboto-slab",
                    }}
                  />
                  <Input
                    type="tel"
                    label="Phone"
                    name="phone"
                    placeholder="0400 123 456"
                    required
                    size="lg"
                    classNames={{
                      input: "font-roboto-slab",
                      label: "font-roboto-slab",
                    }}
                  />
                </div>
              </div>

              {/* Rental Platform */}
              <div>
                <h3 className="text-xl font-semibold text-brand-green mb-4 font-josefin">Rental Platform</h3>
                <Select
                  label="Where do you list your property?"
                  placeholder="Select platform"
                  name="rentalPlatform"
                  required
                  size="lg"
                  classNames={{
                    label: "font-roboto-slab",
                  }}
                >
                  {RENTAL_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </Select>

                <div className="mt-4">
                  <Checkbox name="isRegularBookings" value="yes">
                    <span className="text-gray-700 font-roboto-slab">I have regular bookings and need ongoing maintenance</span>
                  </Checkbox>
                </div>
              </div>

              {/* Service Required */}
              <div>
                <h3 className="text-xl font-semibold text-brand-green mb-4 font-josefin">Service Required</h3>
                <Select
                  label="What service do you need?"
                  placeholder="Select a service"
                  name="serviceType"
                  defaultSelectedKeys={preselectedService ? [preselectedService] : []}
                  required
                  size="lg"
                  classNames={{
                    label: "font-roboto-slab",
                  }}
                >
                  {SERVICE_TYPES.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              {/* Property Address */}
              <div>
                <h3 className="text-xl font-semibold text-brand-green mb-4 font-josefin">Rental Property Address</h3>
                <Input
                  label="Street Address"
                  name="propertyAddress"
                  placeholder="123 Main Street"
                  required
                  size="lg"
                  className="mb-4"
                  classNames={{
                    input: "font-roboto-slab",
                    label: "font-roboto-slab",
                  }}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="City/Suburb"
                    name="city"
                    placeholder="Devonport"
                    defaultValue="Devonport"
                    required
                    size="lg"
                    classNames={{
                      input: "font-roboto-slab",
                      label: "font-roboto-slab",
                    }}
                  />
                  <Input
                    label="Postcode"
                    name="postcode"
                    placeholder="7310 or 7306"
                    required
                    size="lg"
                    classNames={{
                      input: "font-roboto-slab",
                      label: "font-roboto-slab",
                    }}
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <h3 className="text-xl font-semibold text-brand-green mb-4 font-josefin">Property Details</h3>
                <Textarea
                  label="Tell us about your property"
                  name="description"
                  placeholder="e.g., 3 bedroom house with small front lawn and back garden. Currently getting bookings twice a month and need lawn mowed between guests..."
                  minRows={5}
                  required
                  size="lg"
                  classNames={{
                    input: "font-roboto-slab",
                    label: "font-roboto-slab",
                  }}
                />
                <p className="text-sm text-gray-500 mt-2 font-roboto-slab">
                  Please include: property size, current booking frequency, specific areas needing attention
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-brand-green text-white font-semibold text-lg font-josefin"
                  size="lg"
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Get Free Quote'}
                </Button>
                <p className="text-center text-sm text-gray-500 mt-3 font-roboto-slab">
                  We'll respond within 24 hours
                </p>
              </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </ParallaxGap>

      {/* About Section - solid background with curved edges */}
      <section className="relative -mt-[1px]">
        {/* Wave curve at top */}
        <div
          className="absolute top-0 left-0 right-0 w-full overflow-visible leading-[0] z-10"
          style={{ transform: "translateY(-100%)" }}
        >
          <svg
            className="relative block w-full h-[60px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,120 C300,20 900,20 1200,120 Z" fill="#f9fafb" />
          </svg>
        </div>

        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-left mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-2 font-josefin">
                  About Tommy's Law'n Order
                </h2>
                <div className="w-16 h-1 bg-brand-green mb-6"></div>
                <p className="text-gray-600 font-roboto-slab leading-relaxed">
                  Supporting meaningful employment - Tommy is a dedicated young man on the autism spectrum building his future through honest, quality work.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                {[
                  { icon: "✓", title: "Qualified Horticulturalists", desc: "Our supervisors are qualified horticulturalists who know exactly what your rental property needs" },
                  { icon: "✓", title: "4.98★ Rated Airbnb Hosts", desc: "Tommy's carers are experienced hosts who understand what gets those 5-star reviews" },
                  { icon: "✓", title: "Local to Devonport", desc: "We're your neighbours servicing postcodes 7310 & 7306" },
                  { icon: "✓", title: "Supporting Meaningful Work", desc: "Tommy is building his future through honest work - not stuck in a sheltered workshop" },
                  { icon: "✓", title: "Reliable & Consistent", desc: "Scheduled maintenance between bookings so property is always guest-ready" },
                  { icon: "✓", title: "Fair, Honest Pricing", desc: "Transparent pricing with no hidden fees - just quality work at a fair price" },
                ].map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-shrink-0">
                      <i className="text-brand-green text-xl">{item.icon}</i>
                    </div>
                    <div>
                      <h6 className="font-bold text-gray-800 mb-1 font-roboto-slab">{item.title}</h6>
                      <p className="text-gray-600 text-sm font-roboto-slab leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wave curve at bottom */}
        <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0]">
          <svg
            className="relative block w-full h-[60px]"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C300,100 900,100 1200,0 L1200,120 L0,120 Z"
              fill="#282828"
            />
          </svg>
        </div>
      </section>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ContactForm />
    </Suspense>
  );
}
