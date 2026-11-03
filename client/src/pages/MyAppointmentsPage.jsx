import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  QrCode,
  FileText,
  Printer,
} from 'lucide-react';
import SlotSelector from '../components/SlotSelector';

export default function MyAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const [reschedulingAppt, setReschedulingAppt] = useState(null);
  const [campSlots, setCampSlots] = useState([]);
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  const [message, setMessage] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      if (res.data.success) {
        setAppointments(res.data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (e) => {
    e.preventDefault();
    if (!cancellingAppt) return;
    setCancelSubmitting(true);
    try {
      const res = await api.put(`/api/appointments/${cancellingAppt._id}/cancel`, {
        cancellationReason: cancelReason || 'Cancelled by donor',
      });
      if (res.data.success) {
        setMessage('Appointment cancelled successfully.');
        setCancellingAppt(null);
        setCancelReason('');
        fetchAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const openRescheduleModal = async (appt) => {
    setReschedulingAppt(appt);
    setSelectedNewSlot(null);
    try {
      const res = await api.get(`/camps/${appt.camp._id}`);
      if (res.data.success) {
        setCampSlots(res.data.slots);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!reschedulingAppt || !selectedNewSlot) return;
    setRescheduleSubmitting(true);
    try {
      const res = await api.put(`/api/appointments/${reschedulingAppt._id}/reschedule`, {
        slotStartTime: selectedNewSlot.startTime,
        slotEndTime: selectedNewSlot.endTime,
      });
      if (res.data.success) {
        setMessage('Appointment rescheduled successfully.');
        setReschedulingAppt(null);
        fetchAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Blood Donation Bookings</h1>
        <p className="text-xs text-slate-500 mt-1">Manage scheduled appointment slots and review past donation slips</p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="p-1 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading your bookings...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No Appointments Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">You have not scheduled any donation appointments yet.</p>
          <a
            href="/camps"
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-red-700 transition-all"
          >
            Find a Blood Donation Camp
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const isCancellable = ['confirmed', 'pending'].includes(appt.status);
            return (
              <div
                key={appt._id}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                      {appt.appointmentNumber}
                    </span>
                    <StatusBadge status={appt.status} />
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{appt.camp?.name}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-red-500" />
                      {appt.slotStartTime} - {appt.slotEndTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(appt.camp?.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {appt.camp?.venue}, {appt.camp?.city}
                    </span>
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg max-w-xl">
                      Note: {appt.notes}
                    </p>
                  )}

                  {appt.cancellationReason && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg max-w-xl">
                      Cancellation Reason: {appt.cancellationReason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-start md:self-center">
                  {isCancellable && (
                    <>
                      <button
                        onClick={() => openRescheduleModal(appt)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        onClick={() => setCancellingAppt(appt)}
                        className="px-3 py-1.5 rounded-xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancellingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Cancel Appointment #{cancellingAppt.appointmentNumber}?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cancelling will release your reserved slot ({cancellingAppt.slotStartTime} - {cancellingAppt.slotEndTime}) back to other waiting donors.
            </p>

            <form onSubmit={handleCancel} className="mt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Reason for cancellation (optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict, traveling out of town"
                rows="3"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
              ></textarea>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingAppt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm"
                >
                  {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reschedule Appointment Slot</h3>
                <p className="text-xs text-slate-500">Current Slot: {reschedulingAppt.slotStartTime} - {reschedulingAppt.slotEndTime}</p>
              </div>
              <button onClick={() => setReschedulingAppt(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReschedule} className="space-y-4">
              <SlotSelector
                slots={campSlots}
                selectedSlot={selectedNewSlot}
                onSelectSlot={setSelectedNewSlot}
              />

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReschedulingAppt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleSubmitting || !selectedNewSlot}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {rescheduleSubmitting ? 'Rescheduling...' : 'Confirm New Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
