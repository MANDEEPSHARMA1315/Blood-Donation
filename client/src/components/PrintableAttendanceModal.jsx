import React from 'react';
import { X, Printer, Download, Building2, Calendar, MapPin, Users, Heart } from 'lucide-react';

export default function PrintableAttendanceModal({ camp, attendanceData, onClose }) {
  if (!camp || !attendanceData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Sr No', 'Appointment Number', 'Slot Time', 'Donor Name', 'Donor Phone', 'Donor Email', 'Blood Group', 'Status', 'Bag Number', 'Units Collected'];
    const rows = attendanceData.rows.map((r) => [
      r.srNo,
      `"${r.appointmentNumber}"`,
      `"${r.slot}"`,
      `"${r.donorName}"`,
      `"${r.donorPhone}"`,
      `"${r.donorEmail}"`,
      `"${r.bloodGroup}"`,
      `"${r.status}"`,
      `"${r.bagNumber}"`,
      r.unitsCollected,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${camp.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = attendanceData.attendanceStats || {};

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="no-print p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Official Camp Attendance & Donation Register</h2>
            <p className="text-xs text-slate-500">Printable muster sheet for coordinators and medical staff verification</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Register Sheet */}
        <div id="printable-sheet" className="p-8 overflow-y-auto bg-white flex-1 font-sans text-slate-900">
          {/* Sheet Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                  NATIONAL BLOOD DONATION MISSION • OFFICIAL ROSTER
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {camp.name}
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Organized by: <span className="font-bold">{camp.organizer}</span>
                </p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-slate-800">Date: {new Date(camp.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-slate-500">Operating Hours: {camp.startTime} - {camp.endTime}</p>
                <p className="text-slate-500">Venue: {camp.venue}, {camp.city}</p>
              </div>
            </div>

            {/* Quick Stat Badges */}
            <div className="grid grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Capacity</span>
                <span className="text-lg font-black text-slate-900">{camp.capacity}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <span className="text-blue-600 block text-[10px] uppercase font-bold">Registered Donors</span>
                <span className="text-lg font-black text-blue-900">{stats.totalAppointments || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-emerald-600 block text-[10px] uppercase font-bold">Checked In</span>
                <span className="text-lg font-black text-emerald-900">{stats.checkedIn || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-center">
                <span className="text-purple-600 block text-[10px] uppercase font-bold">Units Collected</span>
                <span className="text-lg font-black text-purple-900">{stats.completed || 0}</span>
              </div>
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold">
                  <th className="py-2.5 px-2 text-center w-10">#</th>
                  <th className="py-2.5 px-3">Appt No.</th>
                  <th className="py-2.5 px-3">Slot Time</th>
                  <th className="py-2.5 px-3">Donor Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Blood Grp</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Bag #</th>
                  <th className="py-2.5 px-3 w-28 text-center">Medical Sign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendanceData.rows.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">
                      No donor appointments recorded for this camp yet.
                    </td>
                  </tr>
                ) : (
                  attendanceData.rows.map((row) => (
                    <tr key={row.srNo} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-2 text-center font-mono font-medium text-slate-500">{row.srNo}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.appointmentNumber}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{row.slot}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{row.donorName}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">{row.donorPhone}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-black text-[11px]">
                          {row.bloodGroup}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 capitalize font-medium text-slate-700">
                        {row.status.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                        {row.bagNumber}
                      </td>
                      <td className="py-2.5 px-3 border-l border-slate-200 text-center text-[10px] text-slate-300">
                        ____________
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Verification Signatures at bottom */}
          <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-xs text-center">
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <p className="font-bold text-slate-800">Camp Coordinator</p>
              <p className="text-[10px] text-slate-500">Name & Signature</p>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <p className="font-bold text-slate-800">Lead Medical Officer</p>
              <p className="text-[10px] text-slate-500">License # & Stamp</p>
            </div>
            <div>
              <div className="border-b border-slate-400 pb-8 mb-2"></div>
              <p className="font-bold text-slate-800">Blood Bank Transport Lead</p>
              <p className="text-[10px] text-slate-500">Cold Chain Handover Verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
