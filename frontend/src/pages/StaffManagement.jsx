import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, UserPlus, Save, CheckCircle } from 'lucide-react';

const StaffManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    department: 'Cardiology',
    phone: ''
  });

  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [receptionForm, setReceptionForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    phone: ''
  });

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
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doctors', doctorForm);
      setShowDoctorModal(false);
      setDoctorForm({ name: '', email: '', password: 'password123', department: 'Cardiology', phone: '' });
      fetchDoctors();
      alert('Doctor created successfully with default schedule!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create doctor');
    }
  };

  const handleCreateReceptionist = async (e) => {
    e.preventDefault();
    try {
      await api.post('/doctors/receptionists', receptionForm);
      setShowReceptionModal(false);
      setReceptionForm({ name: '', email: '', password: 'password123', phone: '' });
      alert('Receptionist created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create receptionist');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0] mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a]">Staff & Clinical Shift Administration</h1>
          <p className="text-[12px] text-[#64748b] mt-0.5">
            Configure physician working days, multi-session shifts, breaks, and slot duration
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDoctorModal(true)}
            className="btn-primary text-[12px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Doctor</span>
          </button>
          <button
            onClick={() => setShowReceptionModal(true)}
            className="btn-secondary text-[12px]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Receptionist</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Doctors Directory */}
        <div className="elite-card p-3 h-fit">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2 px-1">
            Doctors ({doctors.length})
          </h2>
          <div className="space-y-1">
            {doctors.map(d => (
              <div
                key={d._id}
                onClick={() => selectDoctor(d)}
                className={`p-2.5 rounded-[5px] cursor-pointer transition text-[12px] ${
                  selectedDoctor?._id === d._id
                    ? 'bg-[#2555ff]/10 border border-[#2555ff]/30 text-[#0f172a]'
                    : 'hover:bg-[#f8fafc] border border-transparent text-[#64748b]'
                }`}
              >
                <div className="font-semibold text-[#0f172a]">{d.name}</div>
                <div className="text-[11px] text-[#2555ff]">{d.department}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Editor */}
        <div className="lg:col-span-3 elite-card p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] mb-4">
            <div>
              <h2 className="text-[14px] font-bold text-[#0f172a]">
                Weekly Shift: {selectedDoctor?.name}
              </h2>
              <p className="text-[11px] text-[#2555ff] font-medium">{selectedDoctor?.department}</p>
            </div>

            <button
              onClick={handleSaveSchedule}
              disabled={loading}
              className="btn-primary text-[12px]"
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

          <div className="space-y-2.5">
            {schedule.map((dayPlan, idx) => (
              <div
                key={dayPlan.day}
                className={`p-3 rounded-[5px] border transition ${
                  dayPlan.isActive
                    ? 'border-[#e2e8f0] bg-white'
                    : 'border-[#f1f5f9] bg-[#f8fafc] opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayPlan.isActive}
                      onChange={() => handleDayToggle(idx)}
                      className="rounded-[3px] text-[#2555ff] focus:ring-[#2555ff]"
                    />
                    <span className="font-semibold text-[#0f172a] text-[13px]">{dayPlan.day}</span>
                  </label>

                  {dayPlan.isActive && (
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-[#64748b]">Slot Duration:</span>
                      <select
                        value={dayPlan.slotDuration}
                        onChange={(e) => handleSlotDurationChange(idx, e.target.value)}
                        className="elite-input py-0.5 px-2 text-[11px] w-auto font-semibold"
                      >
                        <option value={10}>10m</option>
                        <option value={15}>15m</option>
                        <option value={20}>20m</option>
                        <option value={30}>30m</option>
                        <option value={60}>60m</option>
                      </select>
                    </div>
                  )}
                </div>

                {dayPlan.isActive && (
                  <div className="mt-2.5 pt-2 border-t border-[#f1f5f9] grid grid-cols-2 gap-3 text-[11px]">
                    <div className="bg-[#f8fafc] border border-[#e2e8f0] p-2 rounded-[5px]">
                      <span className="font-semibold text-[#2555ff] block mb-1 uppercase text-[10px] tracking-wider">
                        Sessions
                      </span>
                      {dayPlan.sessions?.map((s, sIdx) => (
                        <div key={sIdx} className="text-[#0f172a] font-mono">
                          {s.name}: <b>{s.startTime} – {s.endTime}</b>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#f8fafc] border border-[#e2e8f0] p-2 rounded-[5px]">
                      <span className="font-semibold text-amber-700 block mb-1 uppercase text-[10px] tracking-wider">
                        Breaks (Omitted from Booking)
                      </span>
                      {dayPlan.breaks?.length === 0 ? (
                        <span className="text-[#94a3b8]">No break configured</span>
                      ) : (
                        dayPlan.breaks?.map((b, bIdx) => (
                          <div key={bIdx} className="text-[#0f172a] font-mono">
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

      {/* Add Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDoctor} className="bg-white rounded-[5px] max-w-sm w-full p-5 shadow-xl border border-[#e2e8f0]">
            <h3 className="text-[14px] font-bold text-[#0f172a] mb-3">Add New Doctor</h3>
            <div className="space-y-2.5 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  placeholder="Dr. Robert Chase"
                  className="elite-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  placeholder="chase@emr.com"
                  className="elite-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">Department *</label>
                <input
                  type="text"
                  required
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                  placeholder="Cardiology"
                  className="elite-input"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="btn-secondary text-[11px] py-1 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-[11px] py-1 px-3"
              >
                Create Doctor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Receptionist Modal */}
      {showReceptionModal && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateReceptionist} className="bg-white rounded-[5px] max-w-sm w-full p-5 shadow-xl border border-[#e2e8f0]">
            <h3 className="text-[14px] font-bold text-[#0f172a] mb-3">Add New Receptionist</h3>
            <div className="space-y-2.5 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={receptionForm.name}
                  onChange={(e) => setReceptionForm({ ...receptionForm, name: e.target.value })}
                  placeholder="Allison Cameron"
                  className="elite-input"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={receptionForm.email}
                  onChange={(e) => setReceptionForm({ ...receptionForm, email: e.target.value })}
                  placeholder="cameron@emr.com"
                  className="elite-input"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowReceptionModal(false)}
                className="btn-secondary text-[11px] py-1 px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-[11px] py-1 px-3"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
