import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, User, Shield, Stethoscope, Mail, Phone, Building2, CheckCircle2, LogOut, Clock } from 'lucide-react';

const ProfileModal = ({ open, onOpenChange, user, onLogout }) => {
  if (!user) return null;

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          title: 'Super Administrator',
          subtitle: 'Hospital Governance & Full System Authority',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          icon: <Shield className="w-4 h-4 text-indigo-600" />
        };
      case 'DOCTOR':
        return {
          title: 'Attending Physician',
          subtitle: 'Clinical OPD Queue & Prescription Authority',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80',
          icon: <Stethoscope className="w-4 h-4 text-blue-600" />
        };
      case 'RECEPTIONIST':
        return {
          title: 'Front Desk Lead',
          subtitle: 'Patient Admissions & Lobby Operations',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          icon: <User className="w-4 h-4 text-emerald-600" />
        };
      default:
        return {
          title: role,
          subtitle: 'Hospital Clinical Staff',
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <User className="w-4 h-4 text-slate-600" />
        };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 z-50 animate-in zoom-in-95">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#1e40af] flex items-center justify-center font-bold">
                {roleInfo.icon}
              </div>
              <div>
                <Dialog.Title className="text-base font-bold text-slate-900 tracking-tight">
                  Hospital Identity & Credentials
                </Dialog.Title>
                <Dialog.Description className="text-xs text-slate-500">
                  NexusEMR Clinical Staff Profile
                </Dialog.Description>
              </div>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* User Badge Hero Card */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-5 my-5 flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              {user.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-slate-900 truncate">
                {user.name}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                {user.email}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${roleInfo.badgeClass}`}>
                  {roleInfo.title}
                </span>
                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Active Session
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Credentials Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs mb-6">
            <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Clinical Department
              </span>
              <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.department || 'Hospital Administration'}</span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Direct Contact / Phone
              </span>
              <div className="font-semibold text-slate-800 flex items-center space-x-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{user.phone || 'Desk Extension 100'}</span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Duty Shift Status
              </span>
              <div className="text-slate-800 font-semibold flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>On Duty • Shift Active</span>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Staff Clearance
              </span>
              <div className="text-emerald-700 font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hospital Verified</span>
              </div>
            </div>
          </div>

          {/* System Role Responsibilities */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl text-xs mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Authorized Privileges
            </span>
            <p className="text-slate-600 leading-relaxed">
              {user.role === 'SUPER_ADMIN' && 'Authorized to manage hospital doctor schedules, inspect real-time audit trails, configure clinical shifts, and book appointments across all clinical departments.'}
              {user.role === 'DOCTOR' && 'Authorized to manage the live Outpatient Department (OPD) queue, announce next patients into cabin, record clinical examination vitals, prescribe medications, and issue completion slips.'}
              {user.role === 'RECEPTIONIST' && 'Authorized for patient admissions, verifying appointment status, marking patient arrivals in the lobby, and printing physical OPD queue slips.'}
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Dialog.Close asChild>
              <button
                type="button"
                className="btn-secondary rounded-full px-5 py-2 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </Dialog.Close>

            <button
              type="button"
              onClick={onLogout}
              className="px-5 py-2 rounded-full text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/90 transition flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Session</span>
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ProfileModal;
