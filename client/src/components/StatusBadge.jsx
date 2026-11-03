import React from 'react';

const statusConfig = {
  // Camp & Appointment Statuses
  open: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Open' },
  upcoming: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Upcoming' },
  full: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Capacity Full' },
  completed: { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Completed' },
  cancelled: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled' },
  draft: { bg: 'bg-slate-50 text-slate-700 border-slate-200', label: 'Draft' },

  // Booking / Appointment Statuses
  confirmed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Confirmed' },
  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
  checked_in: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Checked In' },
  no_show: { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'No Show' },

  // Volunteer Shift Statuses
  assigned: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Assigned' },
  attended: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Attended' },
  absent: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Absent' },
  declined: { bg: 'bg-red-50 text-red-700 border-red-200', label: 'Declined' },

  // Donation Status
  successful: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Donation Successful' },
  deferred: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Medically Deferred' },

  // Priorities
  urgent: { bg: 'bg-red-100 text-red-800 border-red-300 font-semibold', label: 'Urgent' },
  high: { bg: 'bg-orange-100 text-orange-800 border-orange-200', label: 'High' },
  medium: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Medium' },
  low: { bg: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Low' },
};

export default function StatusBadge({ status, className = '' }) {
  const norm = String(status || '').toLowerCase();
  const config = statusConfig[norm] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    label: status || 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {config.label}
    </span>
  );
}
