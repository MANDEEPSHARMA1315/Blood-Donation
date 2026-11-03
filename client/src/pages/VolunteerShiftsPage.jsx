import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  ListChecks,
  AlertCircle,
  Building2,
  Heart,
} from 'lucide-react';

export default function VolunteerShiftsPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/volunteers/assignments');
      if (res.data.success) {
        setShifts(res.data.assignments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleUpdateStatus = async (id, status, extra = {}) => {
    setActionLoading(id);
    try {
      const res = await api.put(`/volunteers/assignments/${id}/status`, {
        status,
        ...extra,
      });
      if (res.data.success) {
        setMessage(`Shift successfully marked as ${status}.`);
        fetchShifts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update shift');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Volunteer Shifts & Duties</h1>
        <p className="text-xs text-slate-500 mt-1">Review assigned blood drive shifts, confirm availability, and log duty attendance</p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="p-1 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading shifts...</p>
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
          <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No Volunteer Shifts Assigned</h3>
          <p className="text-xs text-slate-500 mt-1">When camp organizers schedule you for an upcoming drive, your shift will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shifts.map((shift) => {
            const isAssigned = shift.status === 'assigned';
            const isConfirmed = shift.status === 'confirmed';
            const isAttended = shift.status === 'attended';

            return (
              <div
                key={shift._id}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-slate-900">{shift.roleTitle}</span>
                    <StatusBadge status={shift.status} />
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {shift.camp?.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      {shift.camp?.venue}, {shift.camp?.address}, {shift.camp?.city}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Shift: {shift.shiftStartTime} - {shift.shiftEndTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(shift.camp?.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {shift.hoursLogged > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-bold text-purple-600">{shift.hoursLogged} hours logged</span>
                      </>
                    )}
                  </div>

                  {/* Responsibilities list */}
                  {shift.responsibilities && shift.responsibilities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Key Responsibilities
                      </span>
                      <ul className="space-y-1 text-xs text-slate-600">
                        {shift.responsibilities.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Shift Action Controls */}
                <div className="flex flex-wrap md:flex-col items-end gap-2 flex-shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isAssigned && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(shift._id, 'confirmed')}
                        disabled={actionLoading === shift._id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept & Confirm Shift</span>
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(shift._id, 'declined')}
                        disabled={actionLoading === shift._id}
                        className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {isConfirmed && (
                    <div className="space-y-2 text-right">
                      <span className="text-[11px] font-semibold text-emerald-600 block">
                        ✓ Shift Confirmed
                      </span>
                      {!shift.checkInTime ? (
                        <button
                          onClick={() => handleUpdateStatus(shift._id, 'attended', { checkIn: true })}
                          disabled={actionLoading === shift._id}
                          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Clock In at Camp</span>
                        </button>
                      ) : !shift.checkOutTime ? (
                        <button
                          onClick={() => handleUpdateStatus(shift._id, 'attended', { checkOut: true })}
                          disabled={actionLoading === shift._id}
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Clock Out & Log Hours</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg">
                          Shift Completed ({shift.hoursLogged}h)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
