import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Building2, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function CampCard({ camp }) {
  const { user } = useAuth();
  const campDate = new Date(camp.date);
  const formattedDate = campDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const booked = camp.bookedCount || 0;
  const capacity = camp.capacity || 1;
  const percentBooked = Math.min(100, Math.round((booked / capacity) * 100));
  const remainingSlots = Math.max(0, capacity - booked);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-red-200 transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      <div className="p-5">
        {/* Top Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-slate-500" />
            <span className="truncate max-w-[150px]">{camp.organizer}</span>
          </span>
          <StatusBadge status={camp.status} />
        </div>

        {/* Camp Name */}
        <h3 className="font-bold text-base text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1 mb-2">
          {camp.name}
        </h3>

        {/* Location & Time Info */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
            <span className="truncate">{camp.venue}, {camp.city}</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{camp.startTime} - {camp.endTime}</span>
            </div>
          </div>
        </div>

        {/* Capacity Utilization Progress Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" /> Capacity
            </span>
            <span className="font-bold text-slate-800">
              {booked} / {capacity} <span className="text-slate-400 font-normal">({percentBooked}%)</span>
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                percentBooked >= 90
                  ? 'bg-amber-500'
                  : percentBooked >= 100
                  ? 'bg-red-600'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${percentBooked}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-[11px] text-slate-500">
            <span>{remainingSlots} slots remaining</span>
            {camp.completedDonationsCount > 0 && (
              <span className="text-purple-600 font-medium">{camp.completedDonationsCount} units collected</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          to={`/camps/${camp._id}`}
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          Camp Overview
        </Link>

        {camp.status === 'cancelled' ? (
          <span className="text-xs font-medium text-red-600 bg-red-50 px-3 py-1 rounded-lg">
            Cancelled
          </span>
        ) : user?.role === 'coordinator' || user?.role === 'admin' ? (
          <Link
            to={`/camp-operations/${camp._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all"
          >
            <span>Control Desk</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            to={`/camps/${camp._id}`}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20 transition-all"
          >
            <span>{remainingSlots === 0 ? 'View Slots (Full)' : 'Book Slot'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
