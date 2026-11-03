import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SlotSelector from '../components/SlotSelector';
import StatusBadge from '../components/StatusBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Phone,
  User,
} from 'lucide-react';

export default function CampDetailPage() {
  const { id } = useParams();
  const { user, donorProfile } = useAuth();
  const navigate = useNavigate();

  const [camp, setCamp] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [existingAppointment, setExistingAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(true);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchCampDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/camps/${id}`);
      if (res.data.success) {
        setCamp(res.data.camp);
        setSlots(res.data.slots);
      }

      // Check if logged-in donor already has an appointment for this camp
      if (user?.role === 'donor') {
        const apptRes = await api.get(`/appointments?campId=${id}`);
        if (apptRes.data.success && apptRes.data.appointments.length > 0) {
          const active = apptRes.data.appointments.find((a) =>
            ['confirmed', 'checked_in', 'pending'].includes(a.status)
          );
          if (active) setExistingAppointment(active);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load camp details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampDetails();
  }, [id, user]);

  const handleBookSlot = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedSlot) {
      setErrorMessage('Please select an available time slot.');
      return;
    }

    if (!disclaimerAccepted) {
      setErrorMessage('Please acknowledge the medical screening disclaimer before proceeding.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await api.post('/appointments', {
        campId: camp._id,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        notes,
      });

      if (res.data.success) {
        setSuccessMessage('Appointment booked successfully!');
        setExistingAppointment(res.data.appointment);
        fetchCampDetails(); // Refresh remaining slots
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500 font-medium">Loading camp details...</p>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="font-bold text-slate-900 text-lg">Camp Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The requested blood donation camp could not be found.</p>
        <Link to="/camps" className="mt-4 inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
          Return to Camps
        </Link>
      </div>
    );
  }

  const campDate = new Date(camp.date);
  const formattedDate = campDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const booked = camp.bookedCount || 0;
  const capacity = camp.capacity || 1;
  const percentBooked = Math.min(100, Math.round((booked / capacity) * 100));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <Link to="/camps" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Camps</span>
        </Link>
      </div>

      <DisclaimerBanner />

      {/* Main Camp Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {camp.organizer}
              </span>
              <StatusBadge status={camp.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {camp.name}
            </h1>

            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-2">
              <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{camp.venue}, {camp.address}, {camp.city}, {camp.state} - {camp.pincode}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium block">Total Camp Capacity</span>
              <span className="text-2xl font-black text-slate-900">{booked} / {capacity}</span>
              <span className="text-xs text-slate-500 block">({percentBooked}% Reserved)</span>
            </div>
            {['coordinator', 'admin'].includes(user?.role) && (
              <Link
                to={`/camp-operations/${camp._id}`}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5"
              >
                <span>Launch Camp Operations Control</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Schedule & Logistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <Calendar className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Date of Event</span>
              <span className="text-slate-600 font-medium">{formattedDate}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Operating Hours</span>
              <span className="text-slate-600 font-medium">{camp.startTime} - {camp.endTime} ({camp.slotDurationMinutes} min slots)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <Phone className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 block">Camp Helpdesk</span>
              <span className="text-slate-600 font-medium">{camp.contactPerson || 'Camp Desk'}: {camp.contactPhone || 'Available on site'}</span>
            </div>
          </div>
        </div>

        {camp.notes && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
            <span className="font-bold text-slate-700">Organizer Instructions: </span>
            {camp.notes}
          </div>
        )}
      </div>

      {/* Booking Form / Existing Appointment Section */}
      {existingAppointment ? (
        <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3>You Have a Confirmed Appointment for This Camp</h3>
          </div>
          <p className="text-xs text-emerald-700">
            Appointment Number: <span className="font-mono font-bold">{existingAppointment.appointmentNumber}</span> • Slot: <span className="font-bold">{existingAppointment.slotStartTime} - {existingAppointment.slotEndTime}</span>
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Link
              to="/my-appointments"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              View Appointment Ticket
            </Link>
          </div>
        </div>
      ) : camp.status === 'cancelled' ? (
        <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="font-bold text-red-900 text-sm">This Camp Has Been Cancelled</h3>
          <p className="text-xs text-red-700 mt-1">Reason: {camp.cancellationReason || 'Operational rescheduling.'}</p>
        </div>
      ) : camp.bookedCount >= camp.capacity ? (
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl text-center">
          <Users className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h3 className="font-bold text-amber-900 text-sm">All Appointment Slots for This Camp Are Fully Booked</h3>
          <p className="text-xs text-amber-700 mt-1">Please explore alternate upcoming camps in your area.</p>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Select Time Slot & Confirm Appointment</h2>
            <p className="text-xs text-slate-500">Pick a convenient arrival window. Each slot has limited capacity to ensure no waiting queues.</p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleBookSlot} className="space-y-6">
            {/* Slot Selector Component */}
            <SlotSelector
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />

            {/* Optional Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Special Assistance / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. First-time donor, wheelchair access requested"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            {/* Medical Screening Checkbox */}
            <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I understand that booking a slot reserves my screening arrival time. Actual donor eligibility (weight, blood pressure, hemoglobin & health questionnaire) will be determined on-site by qualified medical officers in accordance with national blood safety guidelines.
              </span>
            </label>

            <button
              type="submit"
              disabled={bookingLoading || !selectedSlot}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {bookingLoading ? 'Reserving Your Slot...' : 'Confirm Blood Donation Appointment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
