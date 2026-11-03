import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

export default function DisclaimerBanner({ className = '' }) {
  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-900 ${className}`}
    >
      <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div className="text-xs sm:text-sm">
        <span className="font-semibold text-amber-950">Medical & Eligibility Notice: </span>
        Appointment slots represent registration for blood donation screening. Actual donation eligibility (including hemoglobin, blood pressure, pulse, and medical history) is determined on-site by qualified healthcare professionals and licensed phlebotomists.
      </div>
    </div>
  );
}
