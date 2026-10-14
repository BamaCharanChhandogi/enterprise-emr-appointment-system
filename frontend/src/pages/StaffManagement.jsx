import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, Calendar, Plus, Clock, Save, CheckCircle } from 'lucide-react';

const StaffManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Doctor Form
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: 'password123',
    department: 'Cardiology',
    phone: ''
  });

  // New Receptionist Form
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff & Clinical Schedule Administration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure physician working days, multi-session shifts, lunch breaks, and slot durations
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setShowDoctorModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor</span>
          </button>
          <button
            onClick={() => setShowReceptionModal(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Receptionist</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Doctors Directory Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm h-fit">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Physicians ({doctors.length})
          </h2>
          <div className="space-y-2">
            {doctors.map(d => (
              <div
                key={d._id}
                onClick={() => selectDoctor(d)}
                className={`p-3 rounded-xl cursor-pointer transition border text-sm ${
                  selectedDoctor?._id === d._id
                    ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-sm'
                    : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-700'
                }`}
              >
                <div className="font-bold">{d.name}</div>
                <div className="text-xs text-slate-500">{d.department}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Editor */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Weekly Schedule: {selectedDoctor?.name}
              </h2>
              <p className="text-xs text-slate-500">{selectedDoctor?.department}</p>
            </div>

            <button
              onClick={handleSaveSchedule}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Schedule Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Shift Configuration'}</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {schedule.map((dayPlan, idx) => (
              <div
                key={dayPlan.day}
                className={`p-4 rounded-2xl border transition-all ${
                  dayPlan.isActive
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={dayPlan.isActive}
                      onChange={() => handleDayToggle(idx)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="font-bold text-slate-800 text-sm w-28">{dayPlan.day}</span>
                  </div>

                  {dayPlan.isActive && (
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-500">Slot Duration:</span>
                      <select
                        value={dayPlan.slotDuration}
                        onChange={(e) => handleSlotDurationChange(idx, e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                      >
                        <option value={10}>10 mins</option>
                        <option value={15}>15 mins</option>
                        <option value={20}>20 mins</option>
                        <option value={30}>30 mins</option>
                        <option value={60}>60 mins</option>
                      </select>
                    </div>
                  )}
                </div>

                {dayPlan.isActive && (
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Sessions */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="font-semibold text-blue-700 block mb-2 uppercase tracking-wider text-[11px]">
                        Working Sessions
                      </span>
                      {dayPlan.sessions?.map((s, sIdx) => (
                        <div key={sIdx} className="flex items-center space-x-2 text-slate-700 font-mono mb-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span className="font-sans font-medium text-slate-600">{s.name}:</span>
                          <span className="font-bold">{s.startTime} – {s.endTime}</span>
                        </div>
                      ))}
                    </div>

                    {/* Breaks */}
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100">
                      <span className="font-semibold text-amber-700 block mb-2 uppercase tracking-wider text-[11px]">
                        Rest / Lunch Breaks (Never Booked)
                      </span>
                      {dayPlan.breaks?.length === 0 ? (
                        <span className="text-slate-400">No break scheduled</span>
                      ) : (
                        dayPlan.breaks?.map((b, bIdx) => (
                          <div key={bIdx} className="flex items-center space-x-2 text-slate-700 font-mono mb-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="font-sans font-medium text-slate-600">{b.name}:</span>
                            <span className="font-bold">{b.startTime} – {b.endTime}</span>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDoctor} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Register New Doctor</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Doctor Name *</label>
                <input
                  type="text"
                  required
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                  placeholder="e.g. Dr. Robert Chase"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                  placeholder="chase@emr.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Department *</label>
                <input
                  type="text"
                  required
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                  placeholder="e.g. Cardiology, Pediatrics"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                  placeholder="+1 555-0199"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDoctorModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
              >
                Create Doctor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Receptionist Modal */}
      {showReceptionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateReceptionist} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Register New Receptionist</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Receptionist Name *</label>
                <input
                  type="text"
                  required
                  value={receptionForm.name}
                  onChange={(e) => setReceptionForm({ ...receptionForm, name: e.target.value })}
                  placeholder="e.g. Allison Cameron"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={receptionForm.email}
                  onChange={(e) => setReceptionForm({ ...receptionForm, email: e.target.value })}
                  placeholder="cameron@emr.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={receptionForm.phone}
                  onChange={(e) => setReceptionForm({ ...receptionForm, phone: e.target.value })}
                  placeholder="+1 555-0188"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReceptionModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
              >
                Create Receptionist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
