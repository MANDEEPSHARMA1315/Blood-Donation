import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Download,
  FileSpreadsheet,
  Users,
  Calendar,
  Droplet,
  Heart,
  TrendingUp,
  Award,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/reports/analytics');
        if (res.data.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExportCSV = async (type) => {
    try {
      const response = await api.get(`/reports/export-csv?type=${type}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export CSV report');
    }
  };

  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b', '#06b6d4'];

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500 font-medium">Aggregating system reports...</p>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const bloodGroups = analytics?.charts?.bloodGroupDistribution || [];
  const monthlyTrends = analytics?.charts?.monthlyTrends || [];
  const campUtilization = analytics?.charts?.campUtilization || [];
  const volunteers = analytics?.volunteerParticipation || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header with CSV Export Buttons */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block mb-1">
            Data Intelligence
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive audit metrics, blood units, and capacity trends</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCSV('appointments')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Appointments CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV('donations')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm shadow-red-500/20 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Donations CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Donors Registered</span>
          <div className="text-3xl font-black text-slate-900 mt-1">{summary.totalDonors || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Total database profiles</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Camps</span>
          <div className="text-3xl font-black text-blue-600 mt-1">{summary.totalCamps || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">{summary.completedCamps || 0} completed successfully</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Units Collected</span>
          <div className="text-3xl font-black text-red-600 mt-1">{summary.totalUnitsCollected || 0}</div>
          <p className="text-[11px] text-red-600 font-medium mt-1">Impact ~{(summary.totalUnitsCollected || 0) * 3} patients</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Avg Capacity Fill</span>
          <div className="text-3xl font-black text-emerald-600 mt-1">{summary.overallCapacityUtilizationPct || 0}%</div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">Camp slot efficiency</p>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Donation Trends Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Monthly Collection Velocity</h3>
          <p className="text-xs text-slate-500 mb-4">Total safe units verified by phlebotomy staff</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends}>
                <defs>
                  <linearGradient id="colorDon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="donations" stroke="#dc2626" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDon)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Group Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Blood Group In Stock / Donated</h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown across donor registrations</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bloodGroups}
                    dataKey="count"
                    nameKey="group"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {bloodGroups.map((entry, index) => (
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

      {/* Camp Capacity Utilization Bar Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-1">Camp Slot Capacity vs Actual Reservations</h3>
        <p className="text-xs text-slate-500 mb-4">Comparing configured capacity ceiling with booked appointments</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={campUtilization} barGap={4}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" fill="#cbd5e1" name="Capacity Limit" radius={[4, 4, 0, 0]} />
              <Bar dataKey="booked" fill="#dc2626" name="Appointments Booked" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Volunteer Participation Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-sm mb-1">Volunteer Participation Leaderboard</h3>
        <p className="text-xs text-slate-500 mb-4">Shifts served and logged hours across camp coordinators and volunteers</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-2.5 px-4">Volunteer Name</th>
                <th className="py-2.5 px-4">Shifts Served</th>
                <th className="py-2.5 px-4">Estimated Duty Hours</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {volunteers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-400">
                    No volunteer activity logged yet.
                  </td>
                </tr>
              ) : (
                volunteers.map((v, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>{v.name}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{v.shiftsCount}</td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{v.hours} hrs</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
