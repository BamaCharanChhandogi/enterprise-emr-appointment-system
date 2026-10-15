import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileModal from './ProfileModal';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleLogout = async () => {
    setProfileModalOpen(false);
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }) =>
    `px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap rounded-lg cursor-pointer ${
      isActive
        ? 'bg-[#1e40af] text-white shadow-xs font-semibold'
        : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100/80'
    }`;

  const getRoleLabel = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Admin';
      case 'DOCTOR':
        return 'Doctor';
      case 'RECEPTIONIST':
        return 'Reception';
      default:
        return 'Staff';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* 1. Left: Brand Logo & Title */}
            <Link to="/dashboard" className="flex items-center space-x-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-[#1e40af] flex items-center justify-center text-white shadow-xs font-bold text-base">
                +
              </div>
              <div className="leading-tight">
                <span className="text-[15px] font-bold text-[#0f172a] tracking-tight">
                  Nexus<span className="text-[#1e40af]">EMR</span>
                </span>
                <span className="text-[9px] block text-[#64748b] font-semibold tracking-wider uppercase">
                  Hospital System
                </span>
              </div>
            </Link>

            {/* 2. Middle: Clean Role-Tailored Navigation Pills */}
            {user && (
              <nav className="hidden lg:flex items-center bg-[#f8fafc] border border-[#e2e8f0] p-1 rounded-xl shadow-2xs space-x-1 shrink-0">
                {/* DOCTOR: Focused clinical tabs only */}
                {user.role === 'DOCTOR' && (
                  <>
                    <NavLink to="/dashboard" className={navItemClass}>
                      My Clinic & Live Queue
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

            {/* 3. Right: Single 1-Click Profile Pill (Opens Profile & Signout Modal) */}
            <div className="flex items-center shrink-0">
              {user ? (
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(true)}
                  className="flex items-center space-x-2.5 p-1 pl-2 pr-3.5 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1e40af]/20"
                  title="Click to view Profile & Sign Out"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                      {user.name?.charAt(0)}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </div>

                  <div className="text-left hidden sm:block leading-tight">
                    <div className="text-[12px] font-semibold text-slate-900 max-w-[130px] truncate">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {getRoleLabel(user.role)}
                    </div>
                  </div>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-1.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-[13px] font-medium rounded-lg transition shadow-xs"
                >
                  Sign In
                </Link>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Clinical Profile Credentials & Sign Out Modal */}
      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
};

export default Navbar;
