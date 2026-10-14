import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  UserPlus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  ShieldCheck,
  Stethoscope
} from 'lucide-react';

const BookAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [patientType, setPatientType] = useState('EXISTING'); // 'EXISTING' or 'NEW'
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);

  // New Patient Form fields
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    address: ''
  });

  // Doctor & Slot Details
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(location.state?.doctorId || '');
  const [department, setDepartment] = useState(location.state?.department || '');
  const [date, setDate] = useState(location.state?.date || new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(
    location.state?.slotStartTime
      ? { startTime: location.state.slotStartTime, endTime: location.state.slotEndTime }
      : null
  );

  const [purpose, setPurpose] = useState('General Consultation');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Load doctors
  useEffect(() => {
    api.get('/doctors').then(res => {
      if (res.data?.success) {
        const docs = res.data.data.doctors || [];
        setDoctors(docs);
        if (!selectedDoctorId && docs.length > 0) {
          setSelectedDoctorId(docs[0]._id);
          setDepartment(docs[0].department);
        }
      }
    });
  }, []);

  // Sync department when doctor changes
  useEffect(() => {
    const doc = doctors.find(d => d._id === selectedDoctorId);
    if (doc) {
      setDepartment(doc.department);
    }
  }, [selectedDoctorId, doctors]);

  // Load available slots whenever doctor or date changes
  useEffect(() => {
    if (selectedDoctorId && date) {
      api.get('/slots', {
        params: { doctorId: selectedDoctorId, date }
      }).then(res => {
        if (res.data?.success) {
          const slots = res.data.data.slots || [];
          setAvailableSlots(slots);
        }
      }).catch(err => console.error(err));
    }
  }, [selectedDoctorId, date]);

  // Live Patient Search
  const handleSearchPatient = async (term) => {
    setSearchQuery(term);
    if (!term || term.trim().length === 0) {
      setPatients([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/appointments/patients/search', {
        params: { query: term }
      });
      if (res.data?.success) {
        setPatients(res.data.data.patients || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!selectedSlot) {
      setError('Please select an available time slot');
      return;
    }

    if (patientType === 'EXISTING' && !selectedPatient) {
      setError('Please search and select an existing patient');
      return;
    }

    if (patientType === 'NEW' && (!newPatient.name || !newPatient.phone)) {
      setError('New patient requires name and phone number');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        patientType,
        patientId: selectedPatient?._id,
        newPatientData: patientType === 'NEW' ? {
          ...newPatient,
          age: newPatient.age ? Number(newPatient.age) : undefined
        } : undefined,
        doctorId: selectedDoctorId,
        department,
        date,
        slotStartTime: selectedSlot.startTime,
        slotEndTime: selectedSlot.endTime,
        purpose,
        notes
      };

      const res = await api.post('/appointments', payload);
      if (res.data?.success) {
        setSuccess(res.data.data.appointment);
      }
    } catch (err) {
      // Highlights the concurrency conflict if slot was already taken!
      setError(err.response?.data?.message || err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Book Patient Appointment</h1>
        <p className="text-sm text-slate-500 mt-1">
          Atomic slot reservation with automated collision prevention
        </p>
      </div>

      {success ? (
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Appointment Confirmed!</h2>
          <p className="text-sm text-slate-600 mb-6 font-mono font-bold text-blue-600">
            Reference No: {success.appointmentNumber}
          </p>

          <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-6 text-left text-sm space-y-3 mb-8 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-semibold text-slate-800">{success.patient?.name} ({success.patient?.patientId})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Doctor:</span>
              <span className="font-semibold text-slate-800">{success.doctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{success.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Slot:</span>
              <span className="font-semibold text-blue-700">{success.date} at {success.slotStartTime} - {success.slotEndTime}</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setSuccess(null);
                setSelectedSlot(null);
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Book Another Appointment
            </button>
            <button
              onClick={() => navigate('/appointments')}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition"
            >
              View Appointment List
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Booking Unsuccessful</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Patient Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>1. Patient Identification</span>
              </h2>

              <div className="inline-flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPatientType('EXISTING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    patientType === 'EXISTING' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setPatientType('NEW')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    patientType === 'NEW' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  New Patient
                </button>
              </div>
            </div>

            {patientType === 'EXISTING' ? (
              <div>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchPatient(e.target.value)}
                    placeholder="Search by Patient ID (PAT-...), Phone Number, or Name..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {selectedPatient ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-blue-700">SELECTED PATIENT</p>
                      <h4 className="text-sm font-bold text-slate-900">{selectedPatient.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        ID: {selectedPatient.patientId} • Phone: {selectedPatient.phone}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-xs text-rose-600 font-semibold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  patients.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {patients.map(p => (
                        <div
                          key={p._id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatients([]);
                            setSearchQuery('');
                          }}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-sm"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{p.name}</span>
                            <span className="text-xs text-slate-500 ml-2 font-mono">({p.patientId})</span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{p.phone}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="e.g. Alex Henderson"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    placeholder="e.g. 35"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Doctor and Slot Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Stethoscope className="w-5 h-5 text-indigo-600" />
              <span>2. Physician & Appointment Time</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Doctor</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                >
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                Available Slots for {date}
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                {availableSlots.filter(s => s.isAvailable).length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-slate-400">
                    No available slots on this date. Please pick another date or doctor.
                  </div>
                ) : (
                  availableSlots.filter(s => s.isAvailable).map((slot, i) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Clinical Notes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2 mb-4">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>3. Visit Details</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Routine Checkup, Follow-up, Fever"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Reception / Intake Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional medical history, insurance info or allergies..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
          >
            {loading ? 'Securing Slot via Atomic Lock...' : 'Confirm Appointment Reservation'}
          </button>
        </form>
      )}
    </div>
  );
};

export default BookAppointment;
