import React, { useState, useEffect } from 'react';
import api from '../api/client';
import {
  Users,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'audits'

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Role change modal
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState('donor');
  const [submittingRole, setSubmittingRole] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
      });
      const res = await api.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setUsers(res.data.users);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/audit-logs?limit=30');
      if (res.data.success) {
        setAuditLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchAuditLogs();
    }
  }, [activeTab, search, roleFilter, page]);

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.put(`/users/${userId}/status`);
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isActive: res.data.user.isActive } : u))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmittingRole(true);
    try {
      const res = await api.put(`/users/${editingUser._id}/role`, { role: newRole });
      if (res.data.success) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change role');
    } finally {
      setSubmittingRole(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block mb-1">
            Administration
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Roster & Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage permissions, user credentials, and trace system transactions</p>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Users Directory
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'audits' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Trail
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="coordinator">Coordinator</option>
              <option value="volunteer">Volunteer</option>
              <option value="donor">Donor</option>
            </select>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No users match the search filter.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                          {u.phone && <p className="text-[10px] text-slate-400 font-mono">{u.phone}</p>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                              u.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : u.role === 'coordinator'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : u.role === 'volunteer'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.donorProfile?.bloodGroup ? (
                            <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs">
                              {u.donorProfile.bloodGroup}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {u.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                                setNewRole(u.role);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 font-semibold text-[11px] text-slate-700"
                            >
                              Edit Role
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u._id)}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                                u.isActive
                                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                                  : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Trail Table */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-sm text-slate-900">System Transaction & Security Audit Trail</h2>
            <p className="text-xs text-slate-500">Immutable ledger of administrative, booking, and medical recording actions</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Transaction Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No audit log records available.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {log.entityType}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900">{log.user?.name || 'System / Guest'}</span>
                        {log.user?.role && (
                          <span className="text-[10px] text-slate-400 block capitalize">({log.user.role})</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">Update User Role</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select access role permissions for <span className="font-bold">{editingUser.name}</span>
            </p>

            <form onSubmit={handleUpdateRole} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold capitalize"
                >
                  <option value="donor">Donor (Book appointments, view history)</option>
                  <option value="volunteer">Volunteer (Camp shifts & duties)</option>
                  <option value="coordinator">Coordinator (Camp desk & donor check-in)</option>
                  <option value="admin">Admin (Full system control)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                >
                  {submittingRole ? 'Saving...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
