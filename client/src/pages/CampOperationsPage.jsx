import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import PrintableAttendanceModal from '../components/PrintableAttendanceModal';
import {
  CheckCircle2,
  Clock,
  Droplet,
  Users,
  Search,
  Filter,
  PlusCircle,
  Printer,
  Download,
  AlertCircle,
  Building2,
  Stethoscope,
  ListChecks,
  ShieldCheck,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function CampOperationsPage() {
  const { campId: paramCampId } = useParams();
  const navigate = useNavigate();

  const [camps, setCamps] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState(paramCampId || '');
  const [camp, setCamp] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);

  const [activeTab, setActiveTab] = useState('checkin'); // 'checkin', 'checklist', 'muster'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDonationModal, setShowDonationModal] = useState(null); // appointment object
  const [donationForm, setDonationForm] = useState({
    bloodGroup: 'O+',
    unitsCollected: 1,
    hemoglobinLevel: 13.5,
    bloodPressure: '120/80',
    pulseRate: 72,
    weightKg: 65,
    phlebotomistName: 'Dr. Sharma / Phlebotomist',
    donationStatus: 'successful',
    deferralReason: '',
  });
  const [donationSubmitting, setDonationSubmitting] = useState(false);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'equipment_supply',
    priority: 'high',
    quantity: 1,
    notes: '',
  });

  const [showPrintModal, setShowPrintModal] = useState(false);

  // Load camps list
  useEffect(() => {
    const fetchCamps = async () => {
      try {
        const res = await api.get('/camps?limit=30');
        if (res.data.success) {
          setCamps(res.data.camps);
          if (!selectedCampId && res.data.camps.length > 0) {
            setSelectedCampId(res.data.camps[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCamps();
  }, []);

  // Load details of selected camp
  const fetchCampOpsData = async () => {
    if (!selectedCampId) return;
    setLoading(true);
    try {
      const [campRes, apptRes, taskRes, musterRes] = await Promise.all([
        api.get(`/camps/${selectedCampId}`),
        api.get(`/appointments?campId=${selectedCampId}&limit=100`),
        api.get(`/camp-ops/camps/${selectedCampId}/tasks`),
        api.get(`/camp-ops/camps/${selectedCampId}/attendance-sheet`),
      ]);

      if (campRes.data.success) setCamp(campRes.data.camp);
      if (apptRes.data.success) setAppointments(apptRes.data.appointments);
      if (taskRes.data.success) setTasks(taskRes.data.tasks);
      if (musterRes.data.success) setAttendanceData(musterRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampId) {
      fetchCampOpsData();
    }
  }, [selectedCampId]);

  const handleCampChange = (id) => {
    setSelectedCampId(id);
    navigate(`/camp-operations/${id}`);
  };

  // Check In Donor
  const handleCheckIn = async (appointmentId) => {
    try {
      const res = await api.put(`/camp-ops/appointments/${appointmentId}/check-in`);
      if (res.data.success) {
        fetchCampOpsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  // Open Record Donation modal
  const openDonationModal = (appt) => {
    setShowDonationModal(appt);
    setDonationForm({
      bloodGroup: appt.donorProfile?.bloodGroup || 'O+',
      unitsCollected: 1,
      hemoglobinLevel: 13.5,
      bloodPressure: '120/80',
      pulseRate: 72,
      weightKg: 65,
      phlebotomistName: 'Dr. Sharma / Phlebotomist',
      donationStatus: 'successful',
      deferralReason: '',
    });
  };

  // Submit Donation Record
  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    if (!showDonationModal) return;
    setDonationSubmitting(true);
    try {
      const res = await api.post('/camp-ops/donations', {
        appointmentId: showDonationModal._id,
        ...donationForm,
      });
      if (res.data.success) {
        setShowDonationModal(null);
        fetchCampOpsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record donation');
    } finally {
      setDonationSubmitting(false);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId) => {
    try {
      const res = await api.put(`/camp-ops/tasks/${taskId}/toggle`);
      if (res.data.success) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? res.data.task : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/camp-ops/camps/${selectedCampId}/tasks`, newTask);
      if (res.data.success) {
        setShowAddTaskModal(false);
        setNewTask({ title: '', category: 'equipment_supply', priority: 'high', quantity: 1, notes: '' });
        fetchCampOpsData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add task');
    }
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((a) => {
    const matchesSearch =
      a.donor?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.appointmentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      a.donor?.phone?.includes(search);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const checkedInCount = appointments.filter((a) => ['checked_in', 'completed'].includes(a.status)).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const taskCompletedCount = tasks.filter((t) => t.isCompleted).length;
  const taskProgress = tasks.length > 0 ? Math.round((taskCompletedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header with Camp Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block mb-1">
            Live Camp Coordination Console
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Camp Operations Control Room</h1>
        </div>

        {/* Camp Select Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Active Drive:</label>
          <select
            value={selectedCampId}
            onChange={(e) => handleCampChange(e.target.value)}
            className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-300 font-semibold text-xs text-slate-800 focus:outline-none"
          >
            {camps.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({new Date(c.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {camp && (
        <>
          {/* Operations Stat Badges */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Registered Donors</span>
              <div className="text-3xl font-black text-slate-900 mt-1">{appointments.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Capacity: {camp.capacity} slots</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Checked-In at Desk</span>
              <div className="text-3xl font-black text-blue-600 mt-1">{checkedInCount}</div>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Verified on-site</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Completed Donations</span>
              <div className="text-3xl font-black text-purple-900 mt-1">{completedCount}</div>
              <p className="text-[11px] text-purple-600 font-medium mt-0.5">Blood bags sealed & stored</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase">Readiness Checklist</span>
              <div className="text-3xl font-black text-emerald-600 mt-1">{taskProgress}%</div>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{taskCompletedCount}/{tasks.length} items checked</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('checkin')}
                className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'checkin'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Donor Check-in & Donations ({appointments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('checklist')}
                className={`py-3 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'checklist'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ListChecks className="w-4 h-4" />
                <span>Supplies & Checklist ({tasks.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Attendance Sheet</span>
              </button>
            </div>
          </div>

          {/* TAB 1: DONOR CHECK-IN DESK */}
          {activeTab === 'checkin' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search registered donors by name, phone, or appointment #..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed (Pending Arrival)</option>
                  <option value="checked_in">Checked In</option>
                  <option value="completed">Completed Donation</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-3 px-4">Appt No.</th>
                      <th className="py-3 px-4">Donor Name & Phone</th>
                      <th className="py-3 px-4">Slot Time</th>
                      <th className="py-3 px-4">Blood Group</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Desk Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          No donor appointments match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((appt) => {
                        const canCheckIn = appt.status === 'confirmed';
                        const canRecordDonation = appt.status === 'checked_in';
                        const isDone = appt.status === 'completed';

                        return (
                          <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              {appt.appointmentNumber}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">{appt.donor?.name}</p>
                              <p className="text-[11px] text-slate-500 font-mono">{appt.donor?.phone || appt.donor?.email}</p>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                              {appt.slotStartTime} - {appt.slotEndTime}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-black text-xs">
                                {appt.donorProfile?.bloodGroup || 'O+'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={appt.status} />
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {canCheckIn && (
                                <button
                                  onClick={() => handleCheckIn(appt._id)}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm text-xs transition-all"
                                >
                                  Check In
                                </button>
                              )}

                              {canRecordDonation && (
                                <button
                                  onClick={() => openDonationModal(appt)}
                                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold shadow-sm text-xs transition-all flex items-center gap-1 ml-auto"
                                >
                                  <Droplet className="w-3.5 h-3.5" />
                                  <span>Record Donation</span>
                                </button>
                              )}

                              {isDone && (
                                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                                  ✓ Donation Recorded
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: SUPPLIES & READINESS CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Camp Operational Readiness Checklist</h3>
                  <p className="text-xs text-slate-500">Ensure all biohazard, cold-chain, and phlebotomy equipment items are inspected</p>
                </div>
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 self-start"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Checklist Item</span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span>Overall Camp Readiness</span>
                  <span>{taskProgress}% Ready ({taskCompletedCount}/{tasks.length})</span>
                </div>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${taskProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Checklist items */}
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleToggleTask(task._id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      task.isCompleted
                        ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-1 rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-xs font-semibold ${task.isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600 uppercase">
                            {task.category.replace('_', ' ')}
                          </span>
                          <StatusBadge status={task.priority} />
                        </div>
                      </div>

                      {task.notes && (
                        <p className="text-xs text-slate-500 mt-1">{task.notes}</p>
                      )}

                      {task.isCompleted && task.completedAt && (
                        <span className="text-[10px] text-emerald-600 font-medium block mt-1">
                          ✓ Verified at {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Record Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Blood Donation</h3>
                <p className="text-xs text-slate-500">
                  Donor: <span className="font-bold">{showDonationModal.donor?.name}</span> (#{showDonationModal.appointmentNumber})
                </p>
              </div>
              <button onClick={() => setShowDonationModal(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDonation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Blood Group Verified</label>
                  <select
                    value={donationForm.bloodGroup}
                    onChange={(e) => setDonationForm({ ...donationForm, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-red-600"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Units Collected</label>
                  <input
                    type="number"
                    min="1"
                    max="2"
                    value={donationForm.unitsCollected}
                    onChange={(e) => setDonationForm({ ...donationForm, unitsCollected: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Hemoglobin (g/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={donationForm.hemoglobinLevel}
                    onChange={(e) => setDonationForm({ ...donationForm, hemoglobinLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={donationForm.bloodPressure}
                    onChange={(e) => setDonationForm({ ...donationForm, bloodPressure: e.target.value })}
                    placeholder="120/80"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    value={donationForm.pulseRate}
                    onChange={(e) => setDonationForm({ ...donationForm, pulseRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Donor Weight (kg)</label>
                  <input
                    type="number"
                    value={donationForm.weightKg}
                    onChange={(e) => setDonationForm({ ...donationForm, weightKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Phlebotomist / Medical Staff Name</label>
                <input
                  type="text"
                  required
                  value={donationForm.phlebotomistName}
                  onChange={(e) => setDonationForm({ ...donationForm, phlebotomistName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Screening Result</label>
                <select
                  value={donationForm.donationStatus}
                  onChange={(e) => setDonationForm({ ...donationForm, donationStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="successful">Successful Donation (Safe Unit Collected)</option>
                  <option value="deferred">Medically Deferred</option>
                </select>
              </div>

              {donationForm.donationStatus === 'deferred' && (
                <div>
                  <label className="font-semibold text-red-700 block mb-1">Deferral Clinical Reason</label>
                  <input
                    type="text"
                    required
                    value={donationForm.deferralReason}
                    onChange={(e) => setDonationForm({ ...donationForm, deferralReason: e.target.value })}
                    placeholder="e.g. Hemoglobin below 12.5 g/dL, recent antibiotic usage"
                    className="w-full px-3.5 py-2 bg-red-50 border border-red-200 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDonationModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={donationSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm transition-all"
                >
                  {donationSubmitting ? 'Saving...' : 'Save & Issue Bag Barcode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Add Checklist or Supply Item</h3>
            <p className="text-xs text-slate-500 mb-4">Track camp supplies, safety precautions, and readiness criteria</p>

            <form onSubmit={handleAddTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g. Sterile needles stock count verification"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="equipment_supply">Equipment / Supplies</option>
                    <option value="readiness">Camp Readiness</option>
                    <option value="safety">Safety & Biohazard</option>
                    <option value="logistics">Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Attendance Sheet Modal */}
      {showPrintModal && camp && attendanceData && (
        <PrintableAttendanceModal
          camp={camp}
          attendanceData={attendanceData}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
