import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  AlertTriangle,
  FileBarChart2,
  Cpu,
  UserCog,
  Sliders,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Customer Behavior', path: '/customers', icon: Users },
    { name: 'Fraud Alerts', path: '/alerts', icon: AlertTriangle },
    { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart2 },
    { name: 'Model Performance', path: '/model-performance', icon: Cpu },
  ];

  if (isAdmin) {
    navItems.push({ name: 'User Management', path: '/users', icon: UserCog });
  }

  navItems.push({ name: 'System Settings', path: '/settings', icon: Sliders });

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out border-r border-[#1F293D] bg-[#0E1322] flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1F293D]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-wide text-white uppercase font-mono">
                  Fraud<span className="text-indigo-400">Shield</span> AI
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-tight">Risk Sentinel v1.2</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#161D2F]'
                  } ${collapsed ? 'justify-center' : ''}`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Mini Profile */}
      <div className="p-4 border-t border-[#1F293D] bg-[#0B0F19]/50">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow shrink-0">
            {user?.name ? user.name.slice(0, 2) : 'FS'}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">{user?.name}</span>
              <span className="text-[11px] text-indigo-400 uppercase tracking-wider font-mono">
                {user?.role === 'admin' ? 'Administrator' : 'Fraud Analyst'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
