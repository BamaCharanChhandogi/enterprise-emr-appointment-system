import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    `px-3.5 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap rounded-lg cursor-pointer ${
      isActive
        ? 'bg-[#2555ff] text-white shadow-xs font-semibold'
        : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100/80'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e2e8f0]/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          
          {/* 1. Left: Brand Logo & Title */}
          <Link to="/dashboard" className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#2555ff] flex items-center justify-center text-white shadow-xs font-bold text-base">
              +
            </div>
            <div className="leading-tight">
              <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">
                Nexus<span className="text-[#2555ff]">EMR</span>
              </span>
              <span className="text-[10px] block text-[#64748b] font-medium tracking-wider uppercase">
                Hospital System
              </span>
            </div>
          </Link>

          {/* 2. Middle: Clean Role-Tailored Navigation Pills */}
          {user && (
            <nav className="hidden lg:flex items-center bg-[#f8fafc] border border-[#e2e8f0] p-1 rounded-xl shadow-2xs space-x-1">
              {/* DOCTOR: Focused clinical tabs only */}
              {user.role === 'DOCTOR' && (
                <>
                  <NavLink to="/dashboard" className={navItemClass}>
                    My Clinic & OPD Queue
                  </NavLink>
                  <NavLink to="/appointments" className={navItemClass}>
                    Patient Records
                  </NavLink>
                </>
              )}

              {/* RECEPTIONIST: Front desk operations only */}
              {user.role === 'RECEPTIONIST' && (
                <>
                  <NavLink to="/dashboard" className={navItemClass}>
                    Front Desk & Lobby
                  </NavLink>
                  <NavLink to="/book" className={navItemClass}>
                    Book Appointment
                  </NavLink>
                  <NavLink to="/appointments" className={navItemClass}>
                    All Appointments
                  </NavLink>
                </>
              )}

              {/* SUPER ADMIN: Executive hospital administration */}
              {user.role === 'SUPER_ADMIN' && (
                <>
                  <NavLink to="/dashboard" className={navItemClass}>
                    Hospital Overview
                  </NavLink>
                  <NavLink to="/scheduler" className={navItemClass}>
                    Scheduler Matrix
                  </NavLink>
                  <NavLink to="/book" className={navItemClass}>
                    Book Appointment
                  </NavLink>
                  <NavLink to="/appointments" className={navItemClass}>
                    Appointments Directory
                  </NavLink>
                  <NavLink to="/admin/staff" className={navItemClass}>
                    Doctor Shifts
                  </NavLink>
                  <NavLink to="/admin/audit-logs" className={navItemClass}>
                    Audit Logs
                  </NavLink>
                </>
              )}
            </nav>
          )}

          {/* 3. Right: User Profile Capsule & Logout */}
          <div className="flex items-center space-x-3 shrink-0">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block leading-tight">
                  <div className="text-[13px] font-semibold text-[#0f172a]">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-[#64748b] font-medium">
                    {user.role === 'SUPER_ADMIN' && 'Super Administrator'}
                    {user.role === 'RECEPTIONIST' && 'Front Desk Staff'}
                    {user.role === 'DOCTOR' && `${user.department || 'Physician'}`}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {user.name?.charAt(0)}
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-[12px] font-medium text-[#475569] hover:text-[#b91c1c] hover:bg-rose-50 border border-[#e2e8f0] rounded-lg transition cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 bg-[#2555ff] hover:bg-[#1b44db] text-white text-[13px] font-medium rounded-lg transition shadow-xs"
              >
                Sign In
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
