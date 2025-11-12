"use client";

import { Button, Input, Textarea } from "@nextui-org/react";
import { HeroSlider } from "@/components/HeroSlider";
import { AddressSection } from "@/components/AddressSection";
import ParallaxGap from "@/components/layout/ParallaxGap";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";

// reCAPTCHA site key - replace with your actual key from https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key

declare global {
  interface Window {
    grecaptcha: any;
  }
}

function ContactForm() {
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
      document.head.removeChild(script);
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
        recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'contact_form' });
      }

      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
        recaptchaToken,
      };

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
        image="/images/hero-garden-maintenance.png"
        minHeight="auto"
        overlay="linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.85) 100%)"
      >
        <section className="py-20 w-full">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-white mb-4 font-josefin">Get in Touch</h2>
                <div className="w-16 h-1 bg-brand-green mb-6 mx-auto"></div>
                <p className="text-xl text-white/90 font-roboto-slab mb-2">
                  Have a question? Send us a message
                </p>
                <p className="text-white/80 font-roboto-slab">
                  We'll respond within 24 hours
                </p>
              </div>

              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8">
                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg font-roboto-slab">
                    Thank you! Your message has been sent successfully. We'll get back to you within 24 hours.
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg font-roboto-slab">
                    Sorry, there was an error sending your message. Please try again or email us directly at service@tommyslawnorder.com.au
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">

                  <Input
                    label="Name"
                    name="name"
                    placeholder="John Smith"
                    required
                    size="lg"
                    classNames={{
                      input: "font-roboto-slab",
                      label: "font-roboto-slab",
                    }}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
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
                      size="lg"
                      classNames={{
                        input: "font-roboto-slab",
                        label: "font-roboto-slab",
                      }}
                    />
                  </div>

                  <Textarea
                    label="Message"
                    name="message"
                    placeholder="Tell us how we can help you..."
                    minRows={5}
                    required
                    size="lg"
                    classNames={{
                      input: "font-roboto-slab",
                      label: "font-roboto-slab",
                    }}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-brand-green text-white font-semibold text-lg font-josefin"
                    size="lg"
                    isLoading={isSubmitting}
                    isDisabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </ParallaxGap>

      {/* Contact Info Section with curved edges */}
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
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-800 mb-2 font-josefin">
                  Other Ways to Reach Us
                </h2>
                <div className="w-16 h-1 bg-brand-green mb-6 mx-auto"></div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="mdi:phone" className="text-3xl text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 font-roboto-slab">Phone</h3>
                  <p className="text-gray-600 font-roboto-slab text-sm">
                    Call us for immediate assistance
                  </p>
                  <p className="text-brand-green font-semibold mt-2 font-roboto-slab">
                    service@tommyslawnorder.com.au
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="mdi:email" className="text-3xl text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 font-roboto-slab">Email</h3>
                  <p className="text-gray-600 font-roboto-slab text-sm">
                    Send us an email anytime
                  </p>
                  <p className="text-brand-green font-semibold mt-2 font-roboto-slab">
                    service@tommyslawnorder.com.au
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon icon="mdi:map-marker" className="text-3xl text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2 font-roboto-slab">Service Area</h3>
                  <p className="text-gray-600 font-roboto-slab text-sm">
                    Devonport & Surrounds
                  </p>
                  <p className="text-brand-green font-semibold mt-2 font-roboto-slab">
                    Postcodes 7310 & 7306
                  </p>
                </div>
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
  return <ContactForm />;
}
