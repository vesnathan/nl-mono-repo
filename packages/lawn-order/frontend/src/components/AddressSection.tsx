"use client";

import { Icon } from "@iconify/react";

export function AddressSection() {
  return (
    <div className="bg-brand-green -mt-24 relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 md:gap-6 items-center py-8">
          {/* Address */}
          <div className="flex gap-4 items-start text-white justify-center md:justify-start">
            <div className="flex-shrink-0">
              <Icon icon="mdi:map-marker" className="text-4xl text-white" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-white leading-tight">
                Devonport & Surrounds<br />
                <span className="text-white/80 text-sm font-normal">Postcodes 7310 & 7306</span>
              </p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex gap-4 items-start text-white justify-center md:justify-start">
            <div className="flex-shrink-0">
              <Icon icon="mdi:phone" className="text-4xl text-white" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-white leading-tight">
                Contact for Quote<br />
                <span className="text-white/80 text-sm font-normal">service@tommyslawnorder.com.au</span>
              </p>
            </div>
          </div>

          {/* Hours */}
          <div className="flex gap-4 items-start text-white justify-center md:justify-start">
            <div className="flex-shrink-0">
              <Icon icon="mdi:clock-outline" className="text-4xl text-white" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-white leading-tight">
                Mon - Sat 9:00 - 19:00<br />
                <span className="text-white/80 text-sm font-normal">Sunday Closed</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
