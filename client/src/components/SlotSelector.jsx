import React from 'react';
import { Clock, Check, AlertCircle } from 'lucide-react';

export default function SlotSelector({ slots = [], selectedSlot, onSelectSlot, disabled = false }) {
  if (!slots || slots.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
        <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
        No available time slots configured for this camp.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Select an appointment arrival slot:</span>
        <span className="text-[11px] text-slate-400 font-medium">Arrival within 30 min window</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {slots.map((slot) => {
          const isSelected = selectedSlot?.startTime === slot.startTime;
          const isFull = slot.available <= 0;
          const isDisabled = disabled || isFull;

          return (
            <button
              key={slot.startTime}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectSlot(slot)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-red-600 bg-red-50/60 ring-2 ring-red-500/20 text-red-950 font-semibold'
                  : isFull
                  ? 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-60'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold font-mono tracking-tight">
                  {slot.startTime} - {slot.endTime}
                </span>
                {isSelected ? (
                  <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : isFull ? (
                  <span className="text-[10px] font-bold text-red-500 uppercase">Full</span>
                ) : null}
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>{isFull ? '0 slots' : `${slot.available} available`}</span>
                <span className="text-[10px] text-slate-400">max {slot.maxPerSlot}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
