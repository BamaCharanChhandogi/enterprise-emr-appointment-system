import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSocket } from '../services/socket';
import {
  Calendar as CalendarIcon,
  Filter,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Sparkles
} from 'lucide-react';

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

  // Fetch doctors list
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
      .catch(err => console.error('Error fetching doctors:', err));
  }, []);

  // Fetch dynamic slots when doctor or date changes
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
      setError(err.response?.data?.message || 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  // Real-time WebSocket connection to the specific doctor and date room
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;

    const socket = getSocket();
    socket.emit('join_schedule_room', { doctorId: selectedDoctorId, date: selectedDate });

    const handleSlotChanged = (event) => {
      console.log('⚡ Real-time Slot Update Received via Socket:', event);
      fetchSlots();
    };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Interactive Dynamic Slot Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Clinical Appointment Scheduler</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time slot availability respecting doctor shifts, break intervals, and active bookings
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-600">WebSocket Live Sync Active</span>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Department Filter */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            1. Filter Department
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
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
        </div>

        {/* Doctor Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            2. Select Doctor
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filteredDoctors.map(doc => (
              <option key={doc._id} value={doc._id}>
                {doc.name} ({doc.department})
              </option>
            ))}
          </select>
        </div>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            3. Choose Appointment Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Legend & Slot Status Summary */}
      {slotData && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-100/80 px-6 py-3.5 rounded-xl mb-6 text-xs font-medium text-slate-700">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">{slotData.day}, {slotData.date}</span>
            <span>•</span>
            <span>Total Slots: {slotData.totalSlots}</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">{slotData.availableSlotsCount} Available</span>
            <span>•</span>
            <span className="text-blue-700 font-bold">{slotData.bookedSlotsCount} Booked</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded bg-blue-600"></span>
              <span>Booked</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-300"></span>
              <span>Past Time / Expired</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              <span>Break Time (Omitted)</span>
            </div>
          </div>
        </div>
      )}

      {/* Slot Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">Computing dynamic slot matrix...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-rose-600 flex flex-col items-center">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : slotData?.isPastDate ? (
          <div className="py-16 text-center text-slate-500">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">Past Date Selected</h3>
            <p className="text-sm mt-1">Appointment booking is restricted for dates in the past.</p>
          </div>
        ) : slotData?.slots?.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Working Slots Configured</h3>
            <p className="text-sm mt-1">
              {slotData?.message || 'The selected doctor is not scheduled for consultations on this day.'}
            </p>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {slotData?.slots.map((slot, index) => {
                let cardStyle = "border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-300 text-emerald-900 cursor-pointer shadow-sm";
                let badgeText = "Available";
                let badgeColor = "bg-emerald-200/70 text-emerald-800";

                if (slot.isBooked) {
                  cardStyle = "border-blue-200 bg-blue-50/70 text-blue-900 cursor-not-allowed opacity-90";
                  badgeText = "Booked";
                  badgeColor = "bg-blue-200 text-blue-800";
                } else if (slot.isPastTime) {
                  cardStyle = "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed";
                  badgeText = "Past Slot";
                  badgeColor = "bg-slate-200 text-slate-500";
                }

                return (
                  <div
                    key={index}
                    onClick={() => handleBookSlotClick(slot)}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${cardStyle}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold">{slot.startTime}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{slot.duration} mins</span>
                      <span className="truncate max-w-[65px]">{slot.sessionName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduler;
