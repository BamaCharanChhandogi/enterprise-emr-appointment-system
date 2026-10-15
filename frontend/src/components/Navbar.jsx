import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `whitespace-nowrap px-3 py-1.5 rounded-[5px] text-[13px] font-medium transition-all ${
      isActive
        ? 'bg-[#2555ff] text-white shadow-sm'
        : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
    }`;

  return (
    <header className="bg-white border-b border-[#e2e8f0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left: Brand Identity */}
          <Link to="/dashboard" className="flex items-center space-x-2.5 shrink-0">
            <div className="w-7 h-7 rounded-[5px] bg-[#2555ff] flex items-center justify-center text-white shrink-0">
              <Activity className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="leading-tight">
              <span className="text-[14px] font-bold text-[#0f172a] tracking-tight">
                Nexus<span className="text-[#2555ff]">EMR</span>
              </span>
              <span className="text-[9px] block text-[#64748b] font-medium tracking-wider uppercase">
                Clinical Ops
              </span>
            </div>
          </Link>

          {/* Center: Clean Text Navigation Bar */}
          {user && (
            <nav className="hidden lg:flex items-center space-x-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>

              <NavLink to="/scheduler" className={navLinkClass}>
                Scheduler
              </NavLink>

              {(user.role === 'SUPER_ADMIN' || user.role === 'RECEPTIONIST') && (
                <NavLink to="/book" className={navLinkClass}>
                  Book Slot
                </NavLink>
              )}

              <NavLink to="/appointments" className={navLinkClass}>
                Appointments
              </NavLink>

              {user.role === 'SUPER_ADMIN' && (
                <>
                  <NavLink to="/admin/staff" className={navLinkClass}>
                    Staff & Shifts
                  </NavLink>
                  <NavLink to="/admin/audit-logs" className={navLinkClass}>
                    Audit Trail
                  </NavLink>
                </>
              )}
            </nav>
          )}

          {/* Right: User Profile & Compact Logout */}
          {user && (
            <div className="flex items-center space-x-3 shrink-0">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[12px] font-semibold text-[#0f172a]">{user.name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[5px] bg-[#2555ff]/10 text-[#2555ff] border border-[#2555ff]/20">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[11px] text-[#64748b] font-mono">{user.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-[11px] font-medium text-[#64748b] hover:text-rose-600 hover:bg-rose-50 rounded-[5px] border border-[#e2e8f0] hover:border-rose-200 transition"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
