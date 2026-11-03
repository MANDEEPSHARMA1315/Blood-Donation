import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, HeartHandshake, Stethoscope, User, Zap } from 'lucide-react';

export default function DemoAccountsBar() {
  const { user, switchRoleDemo } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);

  const handleSwitch = async (role) => {
    try {
      setLoadingRole(role);
      await switchRoleDemo(role);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRole(null);
    }
  };

  const roles = [
    { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300' },
    { id: 'coordinator', label: 'Coordinator', icon: Stethoscope, color: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300' },
    { id: 'volunteer', label: 'Volunteer', icon: HeartHandshake, color: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300' },
    { id: 'donor', label: 'Donor', icon: User, color: 'hover:bg-red-50 hover:text-red-700 hover:border-red-300' },
  ];

  return (
    <div className="bg-slate-900 text-white text-xs py-1.5 px-4 shadow-sm border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Quick Demo Switcher:</span>
          {user && (
            <span className="text-slate-400 hidden sm:inline">
              (Current: <span className="font-semibold text-white capitalize">{user.role}</span>)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {roles.map(({ id, label, icon: Icon, color }) => {
            const isActive = user?.role === id;
            return (
              <button
                key={id}
                onClick={() => handleSwitch(id)}
                disabled={loadingRole !== null}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-red-600 text-white border-red-500 shadow-sm'
                    : `bg-slate-800/80 text-slate-200 border-slate-700 ${color}`
                } ${loadingRole === id ? 'opacity-60 cursor-wait' : ''}`}
                title={`Switch to demo ${label}`}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
