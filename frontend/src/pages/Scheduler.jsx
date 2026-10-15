import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSocket } from '../services/socket';

const Scheduler = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [slotData, setSlotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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
  }, []);

  const fetchSlots = async () => {
    if (!selectedDoctorId || !selectedDate) return;
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/slots', {
        params: {
          doctorId: selectedDoctorId,
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
  }, [selectedDoctorId, selectedDate]);

  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    const socket = getSocket();
    socket.emit('join_schedule_room', { doctorId: selectedDoctorId, date: selectedDate });

    const handleSlotChanged = () => fetchSlots();
    socket.on('slot_status_changed', handleSlotChanged);
    socket.on('appointment_event', handleSlotChanged);

    return () => {
      socket.emit('leave_schedule_room', { doctorId: selectedDoctorId, date: selectedDate });
      socket.off('slot_status_changed', handleSlotChanged);
      socket.off('appointment_event', handleSlotChanged);
    };
  }, [selectedDoctorId, selectedDate]);

  const departments = Array.from(new Set(doctors.map(d => d.department).filter(Boolean)));
  const filteredDoctors = selectedDepartment
    ? doctors.filter(d => d.department === selectedDepartment)
    : doctors;

  const handleBookSlotClick = (slot) => {
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
          <h1 className="text-[17px] font-bold text-[#0f172a] tracking-tight">Appointment Scheduler</h1>
          <p className="text-[12px] text-[#64748b] mt-0.5">Filter physician schedules and reserve open consultation slots</p>
        </div>
        <div className="text-[12px] text-[#64748b] font-medium flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Live Availability</span>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="elite-card p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {/* Status Bar */}
      {slotData && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#e2e8f0] px-4 py-2.5 rounded-[5px] mb-4 text-[12px]">
          <div className="flex items-center space-x-2 text-[#0f172a]">
            <span className="font-semibold">{slotData.day}, {slotData.date}</span>
            <span className="text-[#cbd5e1]">•</span>
            <span>Total Slots: <b>{slotData.totalSlots}</b></span>
            <span className="text-[#cbd5e1]">•</span>
            <span className="text-[#15803d] font-semibold">{slotData.availableSlotsCount} Open</span>
            <span className="text-[#cbd5e1]">•</span>
            <span className="text-[#2555ff] font-semibold">{slotData.bookedSlotsCount} Booked</span>
          </div>

          <div className="flex items-center space-x-3 text-[#64748b] text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500"></span>
              <span>Available</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#2555ff]"></span>
              <span>Booked</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#cbd5e1]"></span>
              <span>Elapsed</span>
            </span>
          </div>
        </div>
      )}

      {/* Slot Grid */}
      <div className="elite-card p-5">
        {loading ? (
          <div className="py-16 text-center text-[12px] text-[#64748b]">Calculating slot matrix...</div>
        ) : error ? (
          <div className="py-12 text-center text-[#b91c1c] text-[12px]">{error}</div>
        ) : slotData?.isPastDate ? (
          <div className="py-16 text-center text-[#64748b] text-[12px]">Past dates are not available for booking.</div>
        ) : slotData?.slots?.length === 0 ? (
          <div className="py-16 text-center text-[#64748b] text-[12px]">
            {slotData?.message || 'Physician has no active shift on this date.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {slotData?.slots.map((slot, index) => {
              let style = "border-[#2555ff]/30 bg-[#2555ff]/5 text-[#2555ff] hover:bg-[#2555ff] hover:text-white cursor-pointer";
              let badge = "Open";

              if (slot.isBooked) {
                style = "border-[#e2e8f0] bg-slate-100 text-[#0f172a]/50 cursor-not-allowed";
                badge = "Booked";
              } else if (slot.isPastTime) {
                style = "border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8] cursor-not-allowed";
                badge = "Elapsed";
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleBookSlotClick(slot)}
                  disabled={!slot.isAvailable}
                  className={`p-2.5 rounded-[5px] border text-left transition ${style}`}
                >
                  <div className="text-[13px] font-mono font-bold leading-tight">{slot.startTime}</div>
                  <div className="text-[10px] uppercase font-semibold opacity-75 mt-0.5">{badge}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Scheduler;
