import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Search,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
  Printer
} from 'lucide-react';
import PrintSlipModal from '../components/PrintSlipModal';

const BookAppointment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [patientType, setPatientType] = useState('EXISTING');
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male',
    age: '',
    address: ''
  });

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
  const [printModalOpen, setPrintModalOpen] = useState(false);

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

  useEffect(() => {
    const doc = doctors.find(d => d._id === selectedDoctorId);
    if (doc) {
      setDepartment(doc.department);
    }
  }, [selectedDoctorId, doctors]);

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

  const handleSearchPatient = async (term) => {
    setSearchQuery(term);
    if (!term || term.trim().length === 0) {
      setPatients([]);
      return;
    }
    try {
      const res = await api.get('/appointments/patients/search', {
        params: { query: term }
      });
      if (res.data?.success) {
        setPatients(res.data.data.patients || []);
      }
    } catch (e) {
      console.error(e);
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
      setError('Please select an existing patient record');
      return;
    }

    if (patientType === 'NEW' && (!newPatient.name || !newPatient.phone)) {
      setError('New patient requires at least a name and phone number');
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
      setError(err.response?.data?.message || err.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="pb-4 border-b border-[#e2e8f0] mb-5">
        <h1 className="text-lg font-bold text-[#0f172a]">Book Patient Appointment</h1>
        <p className="text-[12px] text-[#64748b] mt-0.5">
          Atomic slot reservation with automated collision prevention
        </p>
      </div>

      {success ? (
        <div className="elite-card p-8 text-center rounded-xl">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Appointment Reserved Successfully</h2>
          <p className="text-[13px] text-[#2555ff] font-mono font-semibold mt-1 mb-6">
            Ref Number: {success.appointmentNumber}
          </p>

          <div className="max-w-md mx-auto bg-slate-50/80 border border-slate-200/90 rounded-xl p-5 text-left text-[12px] space-y-2.5 mb-6 shadow-2xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient:</span>
              <span className="font-semibold text-slate-800">{success.patient?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Physician:</span>
              <span className="font-semibold text-slate-800">{success.doctor?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{success.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Schedule:</span>
              <span className="font-semibold text-[#2555ff]">{success.date} ({success.slotStartTime} - {success.slotEndTime})</span>
            </div>
          </div>

          <div className="flex justify-center space-x-2.5">
            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              className="btn-primary flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5 mr-1" />
              <span>Print Patient Slip</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSuccess(null);
                setSelectedSlot(null);
              }}
              className="btn-secondary"
            >
              Book Another
            </button>
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="btn-secondary"
            >
              View Directory
            </button>
          </div>

          <PrintSlipModal
            open={printModalOpen}
            onOpenChange={setPrintModalOpen}
            appointment={success}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-[12px] rounded-xl flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Patient Selection */}
          <div className="elite-card p-5">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                1. Patient Information
              </span>

              <div className="inline-flex border border-slate-200/90 p-1 rounded-lg bg-slate-50/80">
                <button
                  type="button"
                  onClick={() => setPatientType('EXISTING')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition ${
                    patientType === 'EXISTING' ? 'bg-[#2555ff] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  onClick={() => setPatientType('NEW')}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-md transition ${
                    patientType === 'NEW' ? 'bg-[#2555ff] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Patient
                </button>
              </div>
            </div>

            {patientType === 'EXISTING' ? (
              <div>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchPatient(e.target.value)}
                    placeholder="Search by name, phone or MRN..."
                    className="elite-input elite-input-with-icon text-[12px]"
                  />
                </div>

                {selectedPatient ? (
                  <div className="p-3.5 bg-[#2555ff]/5 border border-[#2555ff]/20 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-bold text-slate-900">{selectedPatient.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ID: {selectedPatient.patientId} • Phone: {selectedPatient.phone}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      className="text-[11px] text-rose-600 font-semibold hover:underline"
                    >
                      Deselect
                    </button>
                  </div>
                ) : (
                  patients.length > 0 && (
                    <div className="border border-slate-200/90 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto shadow-sm">
                      {patients.map(p => (
                        <div
                          key={p._id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setPatients([]);
                            setSearchQuery('');
                          }}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-[12px] transition"
                        >
                          <span className="font-semibold text-slate-800">{p.name} ({p.patientId})</span>
                          <span className="text-slate-500 font-mono text-[11px]">{p.phone}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full elite-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full elite-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Physician & Time */}
          <div className="elite-card p-5">
            <span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider block mb-3.5">
              2. Physician & Slot
            </span>

            <div className="grid grid-cols-2 gap-3 mb-3 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Physician</label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full elite-input"
                >
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full elite-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Available Time Slots
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                {availableSlots.filter(s => s.isAvailable).length === 0 ? (
                  <div className="col-span-full py-4 text-center text-[12px] text-slate-400">
                    No open slots on this date.
                  </div>
                ) : (
                  availableSlots.filter(s => s.isAvailable).map((slot, i) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-2.5 rounded-lg border text-[12px] font-mono font-bold transition shadow-2xs ${
                          isSelected
                            ? 'bg-[#2555ff] text-white border-[#2555ff] shadow-xs'
                            : 'bg-white text-slate-800 hover:bg-slate-50 border-slate-200'
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

          {/* Section 3: Details */}
          <div className="elite-card p-5">
            <span className="text-[12px] font-bold text-slate-800 uppercase tracking-wider block mb-3.5">
              3. Consultation Details
            </span>

            <div className="space-y-3.5 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Purpose</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Routine Checkup, Follow-up, Fever"
                  className="w-full elite-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Intake Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, previous clinical summary..."
                  className="w-full elite-input"
                ></textarea>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2555ff] hover:bg-[#1b44db] text-white text-[13px] font-semibold rounded-lg transition shadow-xs disabled:opacity-50"
          >
            {loading ? 'Reserving slot...' : 'Confirm Appointment'}
          </button>
        </form>
      )}
    </div>
  );
};

export default BookAppointment;
