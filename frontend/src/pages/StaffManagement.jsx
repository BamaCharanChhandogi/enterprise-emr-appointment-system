import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../services/api';
import { Plus, UserPlus, Save, CheckCircle, Eye, EyeOff, Copy, Key, ShieldCheck, X } from 'lucide-react';

const generateSecurePassword = () => {
  const letters = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '23456789';
  const symbols = '!@#$%&*';
  let pwd = '';
  // Ensure strong composition
  for (let i = 0; i < 5; i++) pwd += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));
  return pwd;
};

const StaffManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Doctor Form Modal
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: generateSecurePassword(),
    department: 'Diagnostics & Internal Medicine',
    phone: '+1 555-0150'
  });

  // Receptionist Form Modal
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showReceptionPassword, setShowReceptionPassword] = useState(false);
  const [receptionForm, setReceptionForm] = useState({
    name: '',
    email: '',
    password: generateSecurePassword(),
    phone: '+1 555-0151'
  });

  // Post-Creation Credentials Success Modal
  const [createdStaffCredentials, setCreatedStaffCredentials] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      if (res.data?.success) {
        const docs = res.data.data.doctors || [];
        setDoctors(docs);
        if (docs.length > 0 && !selectedDoctor) {
          selectDoctor(docs[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const selectDoctor = async (doc) => {
    setSelectedDoctor(doc);
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await api.get(`/doctors/${doc._id}/schedule`);
      if (res.data?.success && res.data.data.schedule) {
        setSchedule(res.data.data.schedule.weeklySchedule || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (index) => {
    const updated = [...schedule];
    updated[index].isActive = !updated[index].isActive;
    setSchedule(updated);
  };

  const handleSlotDurationChange = (index, val) => {
    const updated = [...schedule];
    updated[index].slotDuration = Number(val);
    setSchedule(updated);
  };

  const handleSaveSchedule = async () => {
    if (!selectedDoctor) return;
    setLoading(true);
    setSaveSuccess(false);
    try {
      await api.put(`/doctors/${selectedDoctor._id}/schedule`, {
        weeklySchedule: schedule
      });
      setSaveSuccess(true);
      toast.success('Doctor schedule saved successfully');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/doctors', doctorForm);

      // Save credentials for the confirmation modal
      setCreatedStaffCredentials({
        name: doctorForm.name,
        email: doctorForm.email,
        password: doctorForm.password,
        role: 'Attending Physician (Doctor)',
        department: doctorForm.department,
        phone: doctorForm.phone
      });

      setShowDoctorModal(false);
      setShowCredentialsModal(true);
      setDoctorForm({
        name: '',
        email: '',
        password: generateSecurePassword(),
        department: 'Diagnostics & Internal Medicine',
        phone: '+1 555-0150'
      });
      fetchDoctors();
      toast.success('Doctor created successfully with default weekly schedule');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceptionist = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/doctors/receptionists', receptionForm);

      setCreatedStaffCredentials({
        name: receptionForm.name,
        email: receptionForm.email,
        password: receptionForm.password,
        role: 'Front Desk Receptionist',
        department: 'Admissions & Lobby Operations',
        phone: receptionForm.phone
      });

      setShowReceptionModal(false);
      setShowCredentialsModal(true);
      setReceptionForm({
        name: '',
        email: '',
        password: generateSecurePassword(),
        phone: '+1 555-0151'
      });
      toast.success('Receptionist account created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create receptionist');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStaffCredentials) return;
    const text = `Hospital Personnel Login Credentials
-----------------------------------------
Staff Name: ${createdStaffCredentials.name}
Role: ${createdStaffCredentials.role}
Department: ${createdStaffCredentials.department}
Login Portal: ${window.location.origin}/login
Username / Email: ${createdStaffCredentials.email}
Temporary Password: ${createdStaffCredentials.password}
-----------------------------------------
* Note: Please change your temporary password upon first login.`;

    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div>
          <h1 className="text-[17px] font-bold text-[#0f172a] tracking-tight">
            Staff & Clinical Shift Administration
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Onboard new physicians & receptionists with secure credentials, and manage shift durations and breaks
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setDoctorForm({ ...doctorForm, password: generateSecurePassword() });
              setShowDoctorModal(true);
            }}
            className="btn-primary text-[12px] flex items-center space-x-1.5 cursor-pointer rounded-full px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Doctor</span>
          </button>
          <button
            onClick={() => {
              setReceptionForm({ ...receptionForm, password: generateSecurePassword() });
              setShowReceptionModal(true);
            }}
            className="btn-secondary text-[12px] flex items-center space-x-1.5 cursor-pointer rounded-full px-4 py-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Receptionist</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Doctors Directory */}
        <div className="bg-white border border-slate-200/90 rounded-[24px] p-4.5 h-fit shadow-xs">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
            Clinical Physicians ({doctors.length})
          </h2>
          <div className="space-y-1.5">
            {doctors.map((d) => (
              <div
                key={d._id}
                onClick={() => selectDoctor(d)}
                className={`p-3 rounded-xl cursor-pointer transition text-[12px] ${
                  selectedDoctor?._id === d._id
                    ? 'bg-[#1e40af]/10 border border-[#1e40af]/30 text-slate-900 shadow-2xs font-semibold'
                    : 'hover:bg-slate-50 border border-transparent text-slate-600'
                }`}
              >
                <div className="font-semibold text-slate-900">{d.name}</div>
                <div className="text-[11px] text-[#1e40af] mt-0.5 font-medium">{d.department}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Editor */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-[24px] p-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Weekly Shift: {selectedDoctor?.name}
              </h2>
              <p className="text-[12px] text-[#1e40af] font-medium mt-0.5">{selectedDoctor?.department}</p>
            </div>

            <button
              onClick={handleSaveSchedule}
              disabled={loading}
              className="btn-primary text-[12px] rounded-full px-5 py-2 cursor-pointer flex items-center space-x-1.5"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{loading ? 'Saving...' : 'Save Shifts'}</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {schedule.map((dayPlan, idx) => (
              <div
                key={dayPlan.day}
                className={`p-4 rounded-2xl border transition-all ${
                  dayPlan.isActive
                    ? 'border-slate-200/90 bg-white shadow-2xs'
                    : 'border-slate-100 bg-[#f8fafc] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayPlan.isActive}
                      onChange={() => handleDayToggle(idx)}
                      className="rounded text-[#1e40af] focus:ring-[#1e40af] w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-900 text-[13px]">{dayPlan.day}</span>
                  </label>

                  {dayPlan.isActive && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-slate-500 font-medium">Slot Duration:</span>
                      <select
                        value={dayPlan.slotDuration}
                        onChange={(e) => handleSlotDurationChange(idx, e.target.value)}
                        className="elite-input py-1 px-2.5 text-[11px] w-auto font-semibold rounded-lg"
                      >
                        <option value={10}>10 min</option>
                        <option value={15}>15 min</option>
                        <option value={20}>20 min</option>
                        <option value={30}>30 min</option>
                        <option value={45}>45 min</option>
                        <option value={60}>60 min</option>
                      </select>
                    </div>
                  )}
                </div>

                {dayPlan.isActive && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-[11px]">
                    <div className="bg-[#f8fafc] border border-slate-200/90 p-3 rounded-xl">
                      <span className="font-bold text-[#1e40af] block mb-1 uppercase text-[10px] tracking-wider">
                        Active Sessions
                      </span>
                      {dayPlan.sessions?.map((s, sIdx) => (
                        <div key={sIdx} className="text-slate-800 font-mono">
                          {s.name}: <b>{s.startTime} – {s.endTime}</b>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#f8fafc] border border-slate-200/90 p-3 rounded-xl">
                      <span className="font-bold text-amber-700 block mb-1 uppercase text-[10px] tracking-wider">
                        Breaks (Unavailable for Booking)
                      </span>
                      {dayPlan.breaks?.length === 0 ? (
                        <span className="text-slate-400 italic">No break configured</span>
                      ) : (
                        dayPlan.breaks?.map((b, bIdx) => (
                          <div key={bIdx} className="text-slate-800 font-mono">
                            {b.name}: <b>{b.startTime} – {b.endTime}</b>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 1. Add Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateDoctor}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Add New Physician</h3>
                <p className="text-[12px] text-slate-500">Create attending doctor account and initial shift</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-[12px]">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  placeholder="Dr. Robert Chase"
                  className="elite-input rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Login Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    placeholder="chase@emr.com"
                    className="elite-input rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clinical Department *
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorForm.department}
                    onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                    placeholder="Cardiology"
                    className="elite-input rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact / Intercom Extension
                </label>
                <input
                  type="text"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  placeholder="+1 555-0150"
                  className="elite-input rounded-xl font-mono text-[11px]"
                />
              </div>

              {/* Password Setup */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Initial Login Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setDoctorForm({ ...doctorForm, password: generateSecurePassword() })}
                    className="text-[11px] font-semibold text-[#1e40af] hover:underline cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showDoctorPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                    className="elite-input rounded-xl font-mono text-[12px] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showDoctorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  The doctor will use this temporary password to log in at the sign-in portal.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="btn-secondary text-[12px] py-2 px-4 rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-[12px] py-2 px-6 rounded-full cursor-pointer"
              >
                <span>{loading ? 'Creating...' : 'Create Doctor & Issue Access'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add Receptionist Modal */}
      {showReceptionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateReceptionist}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Add Front Desk Receptionist</h3>
                <p className="text-[12px] text-slate-500">Create admissions & lobby staff account</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReceptionModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-[12px]">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={receptionForm.name}
                  onChange={(e) => setReceptionForm({ ...receptionForm, name: e.target.value })}
                  placeholder="Allison Cameron"
                  className="elite-input rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Login Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={receptionForm.email}
                    onChange={(e) => setReceptionForm({ ...receptionForm, email: e.target.value })}
                    placeholder="cameron@emr.com"
                    className="elite-input rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone / Desk Ext
                  </label>
                  <input
                    type="text"
                    value={receptionForm.phone}
                    onChange={(e) => setReceptionForm({ ...receptionForm, phone: e.target.value })}
                    placeholder="+1 555-0151"
                    className="elite-input rounded-xl font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Password Setup */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Initial Login Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setReceptionForm({ ...receptionForm, password: generateSecurePassword() })}
                    className="text-[11px] font-semibold text-[#1e40af] hover:underline cursor-pointer"
                  >
                    Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showReceptionPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={receptionForm.password}
                    onChange={(e) => setReceptionForm({ ...receptionForm, password: e.target.value })}
                    className="elite-input rounded-xl font-mono text-[12px] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowReceptionPassword(!showReceptionPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showReceptionPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  The receptionist will use this temporary password to log in at the sign-in portal.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReceptionModal(false)}
                className="btn-secondary text-[12px] py-2 px-4 rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-[12px] py-2 px-6 rounded-full cursor-pointer"
              >
                <span>{loading ? 'Creating...' : 'Create Receptionist'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Post-Creation Credentials Success Modal */}
      {showCredentialsModal && createdStaffCredentials && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 mb-4">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Staff Account Credentials Issued
                </h3>
                <p className="text-[12px] text-slate-500">Provide these login credentials to the user</p>
              </div>
            </div>

            <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4.5 space-y-3 text-xs mb-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Staff Member</span>
                <span className="font-bold text-slate-900">{createdStaffCredentials.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Assigned Role</span>
                <span className="font-semibold text-[#1e40af]">{createdStaffCredentials.role}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Sign In Email</span>
                <span className="font-mono font-bold text-slate-900">{createdStaffCredentials.email}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-medium">Temporary Password</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                  {createdStaffCredentials.password}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Login URL</span>
                <span className="font-mono text-[11px] text-slate-600">/login</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mb-5 leading-normal">
              The staff member can now log in at the sign-in portal. Please transmit these credentials securely.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="btn-secondary rounded-full px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Credentials</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCredentialsModal(false);
                  setCreatedStaffCredentials(null);
                }}
                className="btn-primary rounded-full px-6 py-2 text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
