import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import CampCard from '../components/CampCard';
import {
  Search,
  Filter,
  PlusCircle,
  Calendar,
  Grid,
  MapPin,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

export default function CampsPage() {
  const { user } = useAuth();
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'calendar'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New camp form state
  const [newCamp, setNewCamp] = useState({
    name: '',
    organizer: '',
    venue: '',
    address: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    capacity: 50,
    slotDurationMinutes: 30,
    maxPerSlot: 8,
    contactPerson: '',
    contactPhone: '',
    notes: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...(search && { search }),
        ...(cityFilter !== 'all' && { city: cityFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const res = await api.get(`/camps?${params.toString()}`);
      if (res.data.success) {
        setCamps(res.data.camps);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [search, cityFilter, statusFilter, page]);

  const handleCreateCamp = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await api.post('/camps', newCamp);
      if (res.data.success) {
        setShowCreateModal(false);
        fetchCamps();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create camp');
    } finally {
      setSubmitting(false);
    }
  };

  const cities = ['all', 'New Delhi', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad'];
  const statuses = [
    { id: 'all', label: 'All Statuses' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'open', label: 'Open' },
    { id: 'full', label: 'Capacity Full' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Blood Donation Camps & Drives</h1>
          <p className="text-xs text-slate-500 mt-1">Browse, reserve appointment slots, and monitor donation drives</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </button>
          </div>

          {/* Admin Create Camp Button */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm shadow-red-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Camp</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by camp name, venue, organizer, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Cities' : c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Content */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-slate-500 font-medium">Loading blood donation camps...</p>
        </div>
      ) : viewMode === 'grid' ? (
        camps.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No donation camps match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search keyword or city filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {camps.map((camp) => (
              <CampCard key={camp._id} camp={camp} />
            ))}
          </div>
        )
      ) : (
        /* Calendar View */
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Camp Schedule Timeline</h2>
            <span className="text-xs text-slate-500">{camps.length} camps scheduled</span>
          </div>

          <div className="divide-y divide-slate-100">
            {camps.map((camp) => {
              const d = new Date(camp.date);
              return (
                <div key={camp._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-700 border border-red-200 flex flex-col items-center justify-center font-bold flex-shrink-0">
                      <span className="text-xs uppercase">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                      <span className="text-lg leading-none">{d.getDate()}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm">{camp.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                          {camp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {camp.venue}, {camp.city} • {camp.startTime} - {camp.endTime}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Capacity: {camp.bookedCount}/{camp.capacity} booked
                      </p>
                    </div>
                  </div>

                  <a
                    href={`/camps/${camp._id}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all text-center"
                  >
                    View Slots & Booking
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs font-semibold text-slate-700 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-slate-200 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}

      {/* Create Camp Modal (Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="font-bold text-lg text-slate-900">Create Blood Donation Camp</h2>
                <p className="text-xs text-slate-500">Configure venue, capacity, operating hours, and slot intervals</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCamp} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Camp Name</label>
                  <input
                    type="text"
                    required
                    value={newCamp.name}
                    onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                    placeholder="e.g. City LifeSaver Drive 2026"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Organizer / Hospital / NGO</label>
                  <input
                    type="text"
                    required
                    value={newCamp.organizer}
                    onChange={(e) => setNewCamp({ ...newCamp, organizer: e.target.value })}
                    placeholder="e.g. Red Cross Society"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Venue Name</label>
                  <input
                    type="text"
                    required
                    value={newCamp.venue}
                    onChange={(e) => setNewCamp({ ...newCamp, venue: e.target.value })}
                    placeholder="e.g. Community Center Hall"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 block mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={newCamp.address}
                    onChange={(e) => setNewCamp({ ...newCamp, address: e.target.value })}
                    placeholder="Street, area, landmarks"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newCamp.city}
                    onChange={(e) => setNewCamp({ ...newCamp, city: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newCamp.state}
                    onChange={(e) => setNewCamp({ ...newCamp, state: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newCamp.date}
                    onChange={(e) => setNewCamp({ ...newCamp, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newCamp.startTime}
                      onChange={(e) => setNewCamp({ ...newCamp, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={newCamp.endTime}
                      onChange={(e) => setNewCamp({ ...newCamp, endTime: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Capacity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCamp.capacity}
                    onChange={(e) => setNewCamp({ ...newCamp, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Max Donors Per Slot</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCamp.maxPerSlot}
                    onChange={(e) => setNewCamp({ ...newCamp, maxPerSlot: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm transition-all"
                >
                  {submitting ? 'Creating...' : 'Create & Publish Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
