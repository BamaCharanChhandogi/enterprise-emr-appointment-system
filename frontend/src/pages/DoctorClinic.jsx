import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import OpdQueuePanel from '../components/OpdQueuePanel';
import PrintSlipModal from '../components/PrintSlipModal';
import { Printer } from 'lucide-react';

const DoctorClinic = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'schedule' | 'consulted'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slotData, setSlotData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [appToPrint, setAppToPrint] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const doctorId = user?._id || user?.id;

  // Fetch slots for selected date
  const fetchDoctorSlots = async () => {
    if (!doctorId || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const res = await api.get('/slots', {
        params: {
          doctorId,
          date: selectedDate
        }
      });
      if (res.data?.success) {
        setSlotData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to retrieve physician slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Fetch today's completed/consulted appointments for quick history
  const fetchTodayConsultations = async () => {
    if (!doctorId) return;
    try {
      const res = await api.get('/appointments', {
        params: {
          doctorId,
          startDate: today,
          endDate: today,
          limit: 50,
          sortBy: 'slotStartTime',
          sortOrder: 'asc'
        }
      });
      if (res.data?.success) {
        setTodayAppointments(res.data.data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to load consultation history:', err);
    }
  };

  useEffect(() => {
    fetchDoctorSlots();
  }, [selectedDate, doctorId]);

  useEffect(() => {
    fetchTodayConsultations();

    const socket = getSocket();
    if (doctorId) {
      socket.emit('join_schedule_room', { doctorId, date: selectedDate });
    }

    const handleUpdate = () => {
      fetchDoctorSlots();
      fetchTodayConsultations();
    };

    socket.on('slot_status_changed', handleUpdate);
    socket.on('appointment_event', handleUpdate);

    return () => {
      if (doctorId) {
        socket.emit('leave_schedule_room', { doctorId, date: selectedDate });
      }
      socket.off('slot_status_changed', handleUpdate);
      socket.off('appointment_event', handleUpdate);
    };
  }, [doctorId, selectedDate]);

  const waitingPatients = todayAppointments.filter((a) => a.status === 'Arrived');
  const completedPatients = todayAppointments.filter((a) => a.status === 'Completed');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 font-sans">
      
      {/* 1. Serene Clinical Header (28px Radius, Zero Fluff Icons, Pure Medical Typography) */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {user?.name}
            </h1>
            <span className="rounded-full px-3 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              In Clinic
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {user?.department || 'Internal Medicine'} • Cabin 1
          </p>
        </div>

        {/* Clean Patient Summary Counter */}
        <div className="flex items-center space-x-3 text-sm">
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-2 text-right">
            <span className="text-xs uppercase font-semibold text-slate-400 block tracking-wide">
              Today's Queue
            </span>
            <div className="font-semibold text-slate-800 text-sm mt-0.5">
              <span className="text-amber-700">{waitingPatients.length} Waiting</span>
              <span className="text-slate-300 mx-2">•</span>
              <span className="text-emerald-700">{completedPatients.length} Consulted</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Minimalist Pill Tab Switcher (No Fluff Icons, Strict 3-Color Design) */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/80">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-[#1e40af] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Live OPD Queue ({waitingPatients.length})
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-[#1e40af] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Shift Slots Matrix
          </button>

          <button
            onClick={() => setActiveTab('consulted')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition cursor-pointer ${
              activeTab === 'consulted'
                ? 'bg-[#1e40af] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            Today's Consulted ({completedPatients.length})
          </button>
        </div>

        {/* Date Selector for Shifts Tab */}
        {activeTab === 'schedule' && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="elite-input py-1.5 px-3 text-xs w-auto inline-block rounded-xl"
            />
          </div>
        )}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB A: Live OPD Queue & Active Cabin Console */}
      {activeTab === 'queue' && (
        <div>
          <OpdQueuePanel
            doctorId={doctorId}
            doctorName={user?.name}
            department={user?.department}
          />
        </div>
      )}

      {/* TAB B: Shift Slots Matrix (28px Card, Clean Typography, Zero Fluff) */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {slotData && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 px-6 py-3.5 rounded-[22px] text-xs shadow-xs">
              <div className="flex items-center space-x-2 text-slate-800">
                <span className="font-semibold">{slotData.day}, {slotData.date}</span>
                <span className="text-slate-300">•</span>
                <span>Total: <b>{slotData.totalSlots}</b></span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700 font-semibold">{slotData.availableSlotsCount} Open</span>
                <span className="text-slate-300">•</span>
                <span className="text-[#1e40af] font-semibold">{slotData.bookedSlotsCount} Booked</span>
              </div>

              <div className="flex items-center space-x-4 text-slate-500 text-xs">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>Available</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e40af]"></span>
                  <span>Booked</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span>Elapsed</span>
                </span>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 shadow-xs">
            {loadingSlots ? (
              <div className="py-16 text-center text-xs text-slate-500">Retrieving shift slots...</div>
            ) : !slotData || slotData?.slots?.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500">
                {slotData?.message || 'No active shift slots configured on this date.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {slotData.slots.map((slot, index) => {
                  let style = "border-slate-200 bg-white text-slate-900 hover:border-[#1e40af]/60";
                  let badge = "Open";

                  if (slot.isBooked) {
                    style = "border-[#1e40af]/30 bg-blue-50/70 text-[#1e40af] font-semibold";
                    badge = "Booked";
                  } else if (slot.isPastTime) {
                    style = "border-slate-100 bg-slate-50 text-slate-400";
                    badge = "Elapsed";
                  }

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-2xl border text-left transition shadow-2xs ${style}`}
                    >
                      <div className="text-sm font-semibold leading-tight">{slot.startTime}</div>
                      <div className="text-[10px] uppercase font-semibold opacity-75 mt-1">{badge}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB C: Today's Consulted Patient History */}
      {activeTab === 'consulted' && (
        <div className="bg-white border border-slate-200/90 rounded-[28px] overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Today's Consulted Patients ({completedPatients.length})
            </h3>
            <span className="text-xs text-slate-500">DATE: {today}</span>
          </div>

          {completedPatients.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No patients marked completed yet today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-5">Ref Number</th>
                    <th className="py-3 px-5">Patient</th>
                    <th className="py-3 px-5">Slot Time</th>
                    <th className="py-3 px-5">Clinical Diagnosis & Notes</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedPatients.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        {app.appointmentNumber}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900">{app.patient?.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {app.patient?.patientId} • {app.patient?.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#1e40af]">
                        {app.slotStartTime} - {app.slotEndTime}
                      </td>
                      <td className="py-3.5 px-5 max-w-sm text-slate-700 truncate text-xs">
                        {app.consultationNotes || 'General consultation completed.'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => {
                            setAppToPrint(app);
                            setPrintModalOpen(true);
                          }}
                          className="btn-secondary py-1 px-3 text-xs"
                        >
                          <Printer className="w-3 h-3 mr-1 text-slate-500" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* OPD Token Slip Print Modal */}
      <PrintSlipModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        appointment={appToPrint}
      />

    </div>
  );
};

export default DoctorClinic;
