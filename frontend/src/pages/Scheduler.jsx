import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import OpdQueuePanel from '../components/OpdQueuePanel';
import { Bell } from 'lucide-react';

const Scheduler = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isDoctor = user?.role === 'DOCTOR';
  const [showOpdQueue, setShowOpdQueue] = useState(isDoctor);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(isDoctor ? user?.id : '');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [slotData, setSlotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If the logged-in user is a Doctor, strictly lock the scheduler to their own profile
    if (isDoctor) {
      setSelectedDoctorId(user?.id);
      return;
    }

    // For Super Admin & Receptionist, fetch the list of all hospital physicians
    api.get('/doctors')
      .then(res => {
        if (res.data?.success) {
          const docs = res.data.data.doctors || [];
          setDoctors(docs);
          if (docs.length > 0) {
            setSelectedDoctorId(docs[0]._id);
          }
        }
      })
      .catch(err => console.error(err));
  }, [isDoctor, user]);

  const fetchSlots = async () => {
    const doctorIdToFetch = isDoctor ? user?.id : selectedDoctorId;
    if (!doctorIdToFetch || !selectedDate) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/slots', {
        params: {
          doctorId: doctorIdToFetch,
          date: selectedDate
        }
      });
      if (res.data?.success) {
        setSlotData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to retrieve slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedDoctorId, selectedDate, isDoctor, user]);

  useEffect(() => {
    const doctorIdToListen = isDoctor ? user?.id : selectedDoctorId;
    if (!doctorIdToListen || !selectedDate) return;

    const socket = getSocket();
    socket.emit('join_schedule_room', { doctorId: doctorIdToListen, date: selectedDate });

    const handleSlotChanged = () => fetchSlots();
    socket.on('slot_status_changed', handleSlotChanged);
    socket.on('appointment_event', handleSlotChanged);

    return () => {
      socket.emit('leave_schedule_room', { doctorId: doctorIdToListen, date: selectedDate });
      socket.off('slot_status_changed', handleSlotChanged);
      socket.off('appointment_event', handleSlotChanged);
    };
  }, [selectedDoctorId, selectedDate, isDoctor, user]);

  const departments = Array.from(new Set(doctors.map(d => d.department).filter(Boolean)));
  const filteredDoctors = selectedDepartment
    ? doctors.filter(d => d.department === selectedDepartment)
    : doctors;

  const handleBookSlotClick = (slot) => {
    // Doctors cannot book slots directly (that is receptionist/admin's role)
    if (isDoctor) return;
    if (!slot.isAvailable) return;

    const doc = doctors.find(d => d._id === selectedDoctorId);
    navigate('/book', {
      state: {
        doctorId: selectedDoctorId,
        doctorName: doc?.name,
        department: doc?.department,
        date: selectedDate,
        slotStartTime: slot.startTime,
        slotEndTime: slot.endTime
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0] mb-5">
        <div>
          <h1 className="text-[17px] font-bold text-[#0f172a] tracking-tight">
            {isDoctor ? 'My Consultation Schedule & Shifts' : 'Hospital Appointment Scheduler'}
          </h1>
          <p className="text-[12px] text-[#64748b] mt-0.5">
            {isDoctor
              ? `Real-time patient schedule and consultation slots for ${user?.name}`
              : 'Filter physician schedules and reserve open consultation slots'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {isDoctor && (
            <button
              onClick={() => setShowOpdQueue(!showOpdQueue)}
              className="btn-secondary py-1.5 px-3 text-[12px] flex items-center space-x-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-[#2555ff]" />
              <span>{showOpdQueue ? 'Hide OPD Queue' : 'Live OPD Queue'}</span>
            </button>
          )}
          <div className="text-[12px] text-[#64748b] font-medium flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Live Availability</span>
          </div>
        </div>
      </div>

      {/* Doctor Live OPD Queue & Cabin Console */}
      {showOpdQueue && (
        <OpdQueuePanel
          doctorId={isDoctor ? user?.id : selectedDoctorId}
          doctorName={isDoctor ? user?.name : doctors.find((d) => d._id === selectedDoctorId)?.name}
          department={isDoctor ? user?.department : doctors.find((d) => d._id === selectedDoctorId)?.department}
        />
      )}

      {/* Filter Control Bar - Hidden dropdowns for Doctor to strictly protect RBAC */}
      <div className="elite-card p-4 mb-4">
        {isDoctor ? (
          // Doctor View: strictly locked to their own clinic and date picker
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b] block mb-1">
                Attending Physician
              </span>
              <div className="text-[14px] font-bold text-[#0f172a]">
                {user?.name}
              </div>
              <div className="text-[12px] text-[#2555ff] font-medium">
                {user?.department || 'Internal Medicine'}
              </div>
            </div>

            <div className="w-full sm:w-64">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full elite-input"
              />
            </div>
          </div>
        ) : (
          // Admin & Receptionist View: full hospital filters across all doctors
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  const matchedDocs = e.target.value
                    ? doctors.filter(d => d.department === e.target.value)
                    : doctors;
                  if (matchedDocs.length > 0) {
                    setSelectedDoctorId(matchedDocs[0]._id);
                  }
                }}
                className="w-full elite-input"
              >
                <option value="">All Departments</option>
                {departments.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">
                Physician
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full elite-input"
              >
                {filteredDoctors.map(doc => (
                  <option key={doc._id} value={doc._id}>
                    {doc.name} ({doc.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748b] mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full elite-input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Summary Bar */}
      {slotData && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 px-5 py-3 rounded-xl mb-5 text-[12px] shadow-2xs">
          <div className="flex items-center space-x-2 text-[#0f172a]">
            <span className="font-semibold text-slate-800">{slotData.day}, {slotData.date}</span>
            <span className="text-slate-300">•</span>
            <span>Total Slots: <b className="text-slate-800">{slotData.totalSlots}</b></span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">{slotData.availableSlotsCount} Open</span>
            <span className="text-slate-300">•</span>
            <span className="text-[#2555ff] font-semibold">{slotData.bookedSlotsCount} Booked</span>
          </div>

          <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Available</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2555ff]"></span>
              <span>Booked</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
              <span>Elapsed</span>
            </span>
          </div>
        </div>
      )}

      {/* Slot Grid */}
      <div className="elite-card p-6">
        {loading ? (
          <div className="py-16 text-center text-[12px] text-slate-500">Calculating slot matrix...</div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 text-[12px]">{error}</div>
        ) : slotData?.isPastDate ? (
          <div className="py-16 text-center text-slate-500 text-[12px]">Past dates are not available for booking.</div>
        ) : slotData?.slots?.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-[12px]">
            {slotData?.message || 'No active shifts configured on this date.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {slotData?.slots.map((slot, index) => {
              let style = isDoctor
                ? "border-[#2555ff]/25 bg-[#2555ff]/5 text-[#2555ff] cursor-default"
                : "border-[#2555ff]/25 bg-[#2555ff]/5 text-[#2555ff] hover:bg-[#2555ff] hover:text-white hover:shadow-xs cursor-pointer";
              let badge = "Open";

              if (slot.isBooked) {
                style = "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed";
                badge = "Booked";
              } else if (slot.isPastTime) {
                style = "border-slate-100 bg-[#f8fafc] text-slate-300 cursor-not-allowed";
                badge = "Elapsed";
              }

              return (
                <div
                  key={index}
                  onClick={() => handleBookSlotClick(slot)}
                  className={`p-3 rounded-lg border text-left transition-all duration-150 shadow-2xs ${style}`}
                >
                  <div className="text-[13px] font-mono font-bold leading-tight">{slot.startTime}</div>
                  <div className="text-[10px] uppercase font-semibold opacity-80 mt-1">{badge}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Scheduler;
