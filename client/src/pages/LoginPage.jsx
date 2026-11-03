import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Stethoscope, HeartHandshake, User } from 'lucide-react';

export default function LoginPage() {
  const { login, switchRoleDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setLoading(true);
    try {
      const res = await switchRoleDemo(role);
      if (res.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed demo sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'admin', label: 'Admin', icon: ShieldCheck, email: 'admin@blooddonation.org', desc: 'Manage camps, users, & system analytics' },
    { role: 'coordinator', label: 'Coordinator', icon: Stethoscope, email: 'coordinator@blooddonation.org', desc: 'Donor desk check-in, supplies, & muster rolls' },
    { role: 'volunteer', label: 'Volunteer', icon: HeartHandshake, email: 'volunteer@blooddonation.org', desc: 'Camp shift duties, hours, & tasks' },
    { role: 'donor', label: 'Donor', icon: User, email: 'donor@blooddonation.org', desc: 'Book appointments, view history & ticket' },
  ];

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-red-500/25 mb-3">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to BloodLink</h1>
          <p className="text-xs text-slate-500 mt-1">Access the blood donation camp coordination network</p>
        </div>

        {/* Quick Demo Login Cards */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-800">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block mb-2">
            ⚡ Quick 1-Click Demo Evaluation
          </span>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleQuickLogin(role)}
                disabled={loading}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all text-xs font-semibold hover:border-slate-500"
              >
                <Icon className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/20 transition-all text-sm flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-red-600 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
