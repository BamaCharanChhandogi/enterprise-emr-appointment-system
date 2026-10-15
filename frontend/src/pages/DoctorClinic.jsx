import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import OpdQueuePanel from '../components/OpdQueuePanel';
import PrintSlipModal from '../components/PrintSlipModal';
import {
  Stethoscope,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  Printer,
  ChevronRight,
  Layers,
  Activity
} from 'lucide-react';

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

  // Fetch slots for selected date
  const fetchDoctorSlots = async () => {
    if (!user?.id || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const res = await api.get('/slots', {
        params: {
          doctorId: user.id,
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
    if (!user?.id) return;
    try {
      const res = await api.get('/appointments', {
        params: {
          doctorId: user.id,
          startDate: today,
          endDate: today,
          limit: 30,
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
  }, [selectedDate, user?.id]);

  useEffect(() => {
    fetchTodayConsultations();

    const socket = getSocket();
    socket.emit('join_schedule_room', { doctorId: user?.id, date: selectedDate });

    const handleUpdate = () => {
      fetchDoctorSlots();
      fetchTodayConsultations();
    };

    socket.on('slot_status_changed', handleUpdate);
    socket.on('appointment_event', handleUpdate);

    return () => {
      socket.emit('leave_schedule_room', { doctorId: user?.id, date: selectedDate });
      socket.off('slot_status_changed', handleUpdate);
      socket.off('appointment_event', handleUpdate);
    };
  }, [user?.id, selectedDate]);

  const waitingPatients = todayAppointments.filter((a) => a.status === 'Arrived');
  const completedPatients = todayAppointments.filter((a) => a.status === 'Completed');
  const upcomingPatients = todayAppointments.filter((a) => a.status === 'Scheduled');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      
      {/* 1. Physician Clinic Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 mb-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#2555ff] to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {user?.name}
              </h1>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/90 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>In Clinic (Active)</span>
              </span>
            </div>
            <p className="text-[12px] text-slate-500 font-mono mt-0.5">
              DEPARTMENT: <span className="text-[#2555ff] font-semibold">{user?.department || 'Internal Medicine'}</span> • CABIN 1
            </p>
          </div>
        </div>

        {/* Quick Shift Badge */}
        <div className="flex items-center space-x-3 text-[12px]">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Today's Patient Load
            </span>
            <div className="font-mono font-bold text-slate-800 text-[13px]">
              <span className="text-amber-600">{waitingPatients.length} Waiting</span>
              <span className="text-slate-300 mx-1.5">•</span>
              <span className="text-emerald-600">{completedPatients.length} Consulted</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Unified Doctor Command Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200/80 mb-6 pb-2 text-[13px]">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-[#2555ff] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Live OPD Queue & Cabin</span>
            {waitingPatients.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'queue' ? 'bg-white text-[#2555ff]' : 'bg-amber-500 text-white'
              }`}>
                {waitingPatients.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-[#2555ff] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Shift Slots Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('consulted')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'consulted'
                ? 'bg-[#2555ff] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Today's Consulted ({completedPatients.length})</span>
          </button>
        </div>

        {/* Date Selector for Shift View */}
        {activeTab === 'schedule' && (
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="elite-input py-1 px-2.5 text-[12px] w-auto inline-block"
            />
          </div>
        )}
      </div>

      {/* 3. Tab Contents */}

      {/* TAB A: Live OPD Queue & Active Cabin Console */}
      {activeTab === 'queue' && (
        <div>
          <OpdQueuePanel
            doctorId={user?.id}
            doctorName={user?.name}
            department={user?.department}
          />
        </div>
      )}

      {/* TAB B: Shift Slots Matrix (Directly in Doctor's workspace) */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {slotData && (
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 px-5 py-3 rounded-xl text-[12px] shadow-2xs">
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
                  <span>Available Slot</span>
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

          <div className="elite-card p-6">
            {loadingSlots ? (
              <div className="py-16 text-center text-[12px] text-slate-500">Retrieving shift slots...</div>
            ) : slotData?.slots?.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-[12px]">
                {slotData?.message || 'No active shift slots configured for this date.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                {slotData?.slots?.map((slot, index) => {
                  let style = "border-[#2555ff]/25 bg-[#2555ff]/5 text-[#2555ff]";
                  let badge = "Open";

                  if (slot.isBooked) {
                    style = "border-blue-300 bg-blue-50 text-[#2555ff] font-bold";
                    badge = "Booked";
                  } else if (slot.isPastTime) {
                    style = "border-slate-100 bg-[#f8fafc] text-slate-300";
                    badge = "Elapsed";
                  }

                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-left transition shadow-2xs ${style}`}
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
      )}

      {/* TAB C: Today's Consulted Patient History */}
      {activeTab === 'consulted' && (
        <div className="elite-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-white flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-slate-900 tracking-tight">
              Today's Consulted Patients ({completedPatients.length})
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">DATE: {today}</span>
          </div>

          {completedPatients.length === 0 ? (
            <div className="py-16 text-center text-[12px] text-slate-400">
              No patients marked completed yet today.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="elite-table-head">
                  <tr>
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Slot Time</th>
                    <th className="py-3 px-4">Clinical Diagnosis & Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedPatients.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#0f172a]">
                        {app.appointmentNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{app.patient?.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {app.patient?.patientId} • {app.patient?.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#2555ff]">
                        {app.slotStartTime} - {app.slotEndTime}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-700 truncate text-[11px]">
                        {app.consultationNotes || 'General consultation completed.'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setAppToPrint(app);
                            setPrintModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-[11px] font-semibold transition shadow-2xs inline-flex items-center cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-slate-500 mr-1" />
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
