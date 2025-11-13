"use client";

import { Icon } from "@iconify/react";

export function AddressSection() {
  return (
    <div className="bg-brand-green -mt-24 relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 md:gap-6 items-center py-8">
          {/* Service Area */}
          <div className="flex gap-4 items-start text-white justify-center md:justify-start">
            <div className="flex-shrink-0">
              <Icon icon="mdi:map-marker" className="text-4xl text-white" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-white leading-tight">
                Nationwide Service
                <br />
                <span className="text-white/80 text-sm font-normal">
                  Remote & On-Site Available
                </span>
              </p>
            </div>
          </div>

          {/* Email */}
          <div className="flex gap-4 items-start text-white justify-center md:justify-start">
            <div className="flex-shrink-0">
              <Icon icon="mdi:email" className="text-4xl text-white" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-white leading-tight">
                Get In Touch
                <br />
                <span className="text-white/80 text-sm font-normal">
                  hello@appbuilderstudio.com
                </span>
              </p>
            </div>
          </div>

          {/* Services */}
          <div className="flex gap-4 items-start text-white justify-center md:justify-start">
            <div className="flex-shrink-0">
              <Icon
                icon="mdi:lightbulb-on-outline"
                className="text-4xl text-white"
              />
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-white leading-tight">
                Digital Solutions
                <br />
                <span className="text-white/80 text-sm font-normal">
                  Web, Social Media & Marketing
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
