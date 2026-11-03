import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import DisclaimerBanner from '../components/DisclaimerBanner';
import {
  Users,
  Calendar,
  Heart,
  Droplet,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  AlertCircle,
  MapPin,
  TrendingUp,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const { user, donorProfile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [camps, setCamps] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (['admin', 'coordinator'].includes(user?.role)) {
          const [anaRes, campsRes] = await Promise.all([
            api.get('/reports/analytics'),
            api.get('/camps?limit=6'),
          ]);
          if (anaRes.data.success) setAnalytics(anaRes.data);
          if (campsRes.data.success) setCamps(campsRes.data.camps);
        }

        if (user?.role === 'donor') {
          const [apptRes, campsRes] = await Promise.all([
            api.get('/appointments?limit=5'),
            api.get('/camps?status=open&limit=4'),
          ]);
          if (apptRes.data.success) setAppointments(apptRes.data.appointments);
          if (campsRes.data.success) setCamps(campsRes.data.camps);
        }

        if (user?.role === 'volunteer') {
          const [shiftRes, campsRes] = await Promise.all([
            api.get('/volunteers/assignments'),
            api.get('/camps?limit=4'),
          ]);
          if (shiftRes.data.success) setShifts(shiftRes.data.assignments);
          if (campsRes.data.success) setCamps(campsRes.data.camps);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading your coordination dashboard...</p>
        </div>
      </div>
    );
  }

  /* =========================================================================
     1. ADMIN DASHBOARD
     ========================================================================= */
  if (user?.role === 'admin') {
    const summary = analytics?.summary || {};
    const bloodGroupData = analytics?.charts?.bloodGroupDistribution || [];
    const monthlyTrends = analytics?.charts?.monthlyTrends || [];
    const campUtilization = analytics?.charts?.campUtilization || [];

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-600/30 text-red-200 border border-red-500/30">
              System Administrator
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              Camp Coordination Headquarters
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Monitor blood drives, capacity utilization, volunteer assignments, and inventory records across all operational regions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/camps"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-lg shadow-red-600/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Camp</span>
            </Link>
            <Link
              to="/analytics"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Full Analytics</span>
            </Link>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Donors</span>
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalDonors || 0}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Active and consenting
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Camps</span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{summary.upcomingCamps || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">{summary.totalCamps || 0} total drives organized</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointments Booked</span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalAppointments || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Capacity slot reservations</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Units Collected</span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Droplet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-900">{summary.totalUnitsCollected || 0}</div>
            <p className="text-[11px] text-purple-600 font-medium mt-1">~{((summary.totalUnitsCollected || 0) * 3)} lives impacted</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trends */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Monthly Blood Donation Trends</h3>
                <p className="text-xs text-slate-500">Collected blood units over recent months</p>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">Units Collected</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="donations" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorDonations)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Blood Group Distribution */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Donor Blood Group Roster</h3>
              <p className="text-xs text-slate-500 mb-4">Distribution across registered donors</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bloodGroupData} dataKey="count" nameKey="group" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {bloodGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Camp Capacity Utilization Bar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Camp Capacity vs Booked Slots</h3>
              <p className="text-xs text-slate-500">Utilization performance across camps</p>
            </div>
            <Link to="/camps" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
              View all camps <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campUtilization} barGap={4}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="capacity" fill="#cbd5e1" name="Configured Capacity" radius={[4, 4, 0, 0]} />
                <Bar dataKey="booked" fill="#dc2626" name="Appointments Booked" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     2. CAMP COORDINATOR DASHBOARD
     ========================================================================= */
  if (user?.role === 'coordinator') {
    const summary = analytics?.summary || {};

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-200 border border-blue-400/30">
            Camp Coordinator Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Camp Operations Control Room
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Execute on-site donor check-ins, record completed blood units, inspect readiness checklists, and export official attendance registers.
          </p>
        </div>

        {/* Quick Operational Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Drives</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{camps.length}</div>
            <p className="text-[11px] text-blue-600 font-medium mt-1">Camps under coordination</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Appointments</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{summary.totalAppointments || 0}</div>
            <p className="text-[11px] text-slate-500 mt-1">Scheduled donor slots</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Successful Donations</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{summary.successfulDonations || 0}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Units safely collected</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Volunteers Active</span>
            <div className="text-2xl sm:text-3xl font-black text-purple-900 mt-1">{summary.totalVolunteers || 0}</div>
            <p className="text-[11px] text-purple-600 font-medium mt-1">Staffing camp stations</p>
          </div>
        </div>

        {/* Camps to Manage */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Blood Donation Camps Roster</h2>
              <p className="text-xs text-slate-500">Access operational check-in, checklists, and muster sheets</p>
            </div>
            <Link to="/camps" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
              Browse all camps <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {camps.map((camp) => (
              <div key={camp._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-sm">{camp.name}</h3>
                    <StatusBadge status={camp.status} />
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-3">
                    <span>{camp.venue}, {camp.city}</span>
                    <span>•</span>
                    <span>{new Date(camp.date).toLocaleDateString()} ({camp.startTime} - {camp.endTime})</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/camp-operations/${camp._id}`}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <span>Launch Control Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================================
     3. VOLUNTEER DASHBOARD
     ========================================================================= */
  if (user?.role === 'volunteer') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            Camp Volunteer Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Welcome, {user?.name}!
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            View your scheduled shifts, confirm attendance, check station responsibilities, and assist in smooth camp logistics.
          </p>
        </div>

        {/* Assigned Shifts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Shifts</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{shifts.length}</div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Registered assignments</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Confirmed Duty</span>
            <div className="text-3xl font-black text-blue-600 mt-1">
              {shifts.filter((s) => s.status === 'confirmed').length}
            </div>
            <p className="text-[11px] text-blue-600 font-medium mt-1">Ready for camp day</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Completed Hours</span>
            <div className="text-3xl font-black text-purple-900 mt-1">
              {shifts.reduce((acc, s) => acc + (s.hoursLogged || 0), 0)}h
            </div>
            <p className="text-[11px] text-purple-600 font-medium mt-1">Volunteer service logged</p>
          </div>
        </div>

        {/* Current / Upcoming Shift List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900 text-base">Your Assigned Volunteer Shifts</h2>
            <Link to="/volunteer-shifts" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Manage shifts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {shifts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <Heart className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
              You currently have no assigned shifts. The coordinator will assign you soon.
            </div>
          ) : (
            <div className="space-y-4">
              {shifts.map((shift) => (
                <div key={shift._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">{shift.roleTitle}</span>
                      <StatusBadge status={shift.status} />
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Camp: {shift.camp?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Shift: {shift.shiftStartTime} - {shift.shiftEndTime} • {new Date(shift.camp?.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    to="/volunteer-shifts"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm text-center"
                  >
                    View Duty Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* =========================================================================
     4. DONOR DASHBOARD
     ========================================================================= */
  const activeAppointment = appointments.find((a) => ['confirmed', 'checked_in'].includes(a.status));
  const bloodGroup = donorProfile?.bloodGroup || 'O+';
  const totalDonations = donorProfile?.totalDonationsCount || 0;

  return (
    <div className="space-y-6">
      <DisclaimerBanner />

      {/* Hero Banner for Donor */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                Blood Group: {bloodGroup}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Eligible Donor
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2.5">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-red-100 text-sm mt-1 max-w-xl">
              Every donation can save up to 3 precious lives. Book an appointment slot at an upcoming camp near you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/camps"
              className="px-5 py-3 rounded-2xl bg-white text-red-600 hover:bg-red-50 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
            >
              <span>Find Nearby Camps</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Donor Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Donations Completed</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{totalDonations}</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Verified units</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Lives Saved</span>
          <div className="text-3xl font-black text-red-600 mt-1">{totalDonations * 3}</div>
          <p className="text-[11px] text-red-600 font-medium mt-1">3 lives per unit</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Blood Group</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{bloodGroup}</div>
          <p className="text-[11px] text-slate-500 mt-1">Universal recipient / donor match</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Data Consent</span>
          <div className="text-lg font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Active & Private
          </div>
          <Link to="/profile" className="text-[11px] text-slate-500 hover:underline block mt-1">
            Manage privacy settings
          </Link>
        </div>
      </div>

      {/* Active Appointment Ticket Card */}
      {activeAppointment && (
        <div className="bg-white rounded-3xl border-2 border-red-200/80 p-6 shadow-md shadow-red-500/5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h2 className="text-sm font-bold text-slate-900">Your Upcoming Appointment Confirmation</h2>
            </div>
            <StatusBadge status={activeAppointment.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500 font-medium">Appointment Number</p>
              <p className="font-mono font-bold text-lg text-slate-900">{activeAppointment.appointmentNumber}</p>
              <p className="text-xs text-slate-500 mt-2">Camp</p>
              <p className="font-semibold text-slate-900 text-sm">{activeAppointment.camp?.name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500 font-medium">Scheduled Time Slot</p>
              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-red-500" />
                {activeAppointment.slotStartTime} - {activeAppointment.slotEndTime}
              </p>
              <p className="text-xs text-slate-500 mt-2">Date</p>
              <p className="font-semibold text-slate-900 text-sm">
                {new Date(activeAppointment.camp?.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="flex flex-col justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Venue Address</p>
                <p className="text-xs text-slate-700 flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{activeAppointment.camp?.venue}, {activeAppointment.camp?.address}, {activeAppointment.camp?.city}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Link
                  to="/my-appointments"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all"
                >
                  View Details & Pass
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Camps Near You */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Upcoming Donation Camps</h2>
            <p className="text-xs text-slate-500">Pick a convenient camp and reserve your time slot</p>
          </div>
          <Link to="/camps" className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1">
            Browse all camps <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {camps.map((camp) => (
            <div key={camp._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-red-200 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500">{camp.organizer}</span>
                  <StatusBadge status={camp.status} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-1">{camp.name}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {camp.venue}, {camp.city}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 mt-2">
                <span className="text-xs text-slate-600">
                  {new Date(camp.date).toLocaleDateString()}
                </span>
                <Link
                  to={`/camps/${camp._id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  Book Slot
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
