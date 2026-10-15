import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  Volume2,
  UserCheck,
  Activity,
  Clock,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Sparkles,
  RefreshCw,
  User,
  Heart,
  Thermometer,
  FileText
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';

// Web Audio API Chime synthesizer for hospital announcement
const playClinicalChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two harmonious chime tones: D5 (587.33 Hz) -> A5 (880 Hz)
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.14);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.start(now);
    osc.stop(now + 0.65);
  } catch (err) {
    console.debug('Audio chime skipped:', err);
  }
};

const OpdQueuePanel = ({ doctorId, doctorName, department }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePatient, setActivePatient] = useState(null);
  const [callingId, setCallingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Active consultation form
  const [consultNotes, setConsultNotes] = useState('');
  const [vitals, setVitals] = useState({
    bp: '',
    pulse: '',
    temp: '',
    spo2: ''
  });

  const today = new Date().toISOString().split('T')[0];

  const fetchTodayQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments', {
        params: {
          doctorId: doctorId || (user.role === 'DOCTOR' ? user.id : undefined),
          startDate: today,
          endDate: today,
          limit: 50,
          sortBy: 'slotStartTime',
          sortOrder: 'asc'
        }
      });

      if (res.data?.success) {
        setAppointments(res.data.data.appointments || []);
      }
    } catch (err) {
      console.error('Failed to fetch OPD queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayQueue();

    const socket = getSocket();

    const handleEvent = (data) => {
      fetchTodayQueue();
    };

    const handlePatientCalled = (data) => {
      playClinicalChime();
      toast.info(
        `📢 Patient Call: ${data.patientName} (Token ${data.appointmentNumber}) please proceed to Cabin 1 (${data.doctorName || 'Consultation Room'})`,
        { duration: 6000 }
      );
    };

    socket.on('appointment_event', handleEvent);
    socket.on('patient_called', handlePatientCalled);

    return () => {
      socket.off('appointment_event', handleEvent);
      socket.off('patient_called', handlePatientCalled);
    };
  }, [doctorId, user]);

  // Arrived patients waiting in lobby
  const waitingQueue = appointments.filter((a) => a.status === 'Arrived');
  // Upcoming scheduled patients who haven't arrived yet
  const scheduledQueue = appointments.filter((a) => a.status === 'Scheduled');
  // Today's completed consultations
  const completedList = appointments.filter((a) => a.status === 'Completed');

  // Next patient in line
  const nextInLine = waitingQueue.length > 0 ? waitingQueue[0] : null;

  // Call patient action
  const handleCallPatient = (patientApp) => {
    if (!patientApp) return;

    setCallingId(patientApp._id);
    setActivePatient(patientApp);
    setConsultNotes(patientApp.consultationNotes || '');

    // Reset vitals for new consultation
    setVitals({
      bp: '120/80',
      pulse: '74 bpm',
      temp: '98.4°F',
      spo2: '99%'
    });

    playClinicalChime();

    // Broadcast across socket for lobby displays & front desk
    const socket = getSocket();
    socket.emit('call_patient', {
      appointmentId: patientApp._id,
      appointmentNumber: patientApp.appointmentNumber,
      patientName: patientApp.patient?.name || 'Patient',
      doctorName: patientApp.doctor?.name || doctorName || user.name,
      department: patientApp.department || department,
      cabin: 'Cabin 1',
      calledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    toast.success(`Calling ${patientApp.patient?.name} (Token ${patientApp.appointmentNumber}) into Cabin`);

    setTimeout(() => {
      setCallingId(null);
    }, 1500);
  };

  // Receptionist: Mark Arrived
  const handleMarkArrived = async (id) => {
    try {
      setActionLoading(true);
      await api.post(`/appointments/${id}/arrive`);
      toast.success('Patient checked in to OPD lobby queue');
      fetchTodayQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to check in');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete consultation
  const handleCompleteConsultation = async () => {
    if (!activePatient) return;

    try {
      setActionLoading(true);

      const vitalsSummary = `[VITALS: BP: ${vitals.bp} | Pulse: ${vitals.pulse} | Temp: ${vitals.temp} | SpO2: ${vitals.spo2}]\n\n`;
      const fullNotes = vitalsSummary + (consultNotes || 'General consultation completed. Routine evaluation.');

      await api.put(`/appointments/${activePatient._id}`, {
        status: 'Completed',
        consultationNotes: fullNotes
      });

      toast.success(`Consultation completed for ${activePatient.patient?.name}`);

      setActivePatient(null);
      setConsultNotes('');
      fetchTodayQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save consultation');
    } finally {
      setActionLoading(false);
    }
  };

  const applyQuickRx = (templateText) => {
    setConsultNotes((prev) => (prev ? `${prev}\n• ${templateText}` : `• ${templateText}`));
  };

  return (
    <div className="elite-card p-5 mb-6 overflow-hidden border-slate-200/90 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2555ff]/10 text-[#2555ff] flex items-center justify-center font-bold">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
                Live OPD Consultation & Lobby Queue
              </h2>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              DATE: {today} • ATTENDING: {doctorName || user.name}
            </p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center space-x-2 text-[11px]">
          <span className="bg-amber-50 text-amber-800 border border-amber-200/90 px-2.5 py-1 rounded-md font-semibold flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>{waitingQueue.length} In Lobby</span>
          </span>
          <span className="bg-blue-50 text-[#2555ff] border border-blue-200/80 px-2.5 py-1 rounded-md font-semibold">
            {completedList.length} Consulted
          </span>
          <button
            onClick={fetchTodayQueue}
            disabled={loading}
            title="Refresh Queue"
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero "Call Next Patient" Banner */}
      <div className="my-4">
        {nextInLine ? (
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 border border-blue-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#2555ff] text-white flex items-center justify-center shadow-xs">
                <Volume2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#2555ff]">
                  Next In Line • Waiting Outside
                </div>
                <div className="text-[15px] font-extrabold text-slate-900 leading-tight">
                  {nextInLine.patient?.name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Token: <b>{nextInLine.appointmentNumber}</b> • Slot: {nextInLine.slotStartTime} - {nextInLine.slotEndTime}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleCallPatient(nextInLine)}
              disabled={callingId === nextInLine._id}
              className="btn-primary py-2.5 px-5 text-[13px] flex items-center justify-center space-x-2 shadow-sm font-bold"
            >
              <Bell className="w-4 h-4 mr-1 text-white" />
              <span>{callingId === nextInLine._id ? 'Announcing...' : 'Call Next Patient into Cabin'}</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center text-slate-500 text-[12px] flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Lobby Queue Clear — No patients currently waiting outside.</span>
          </div>
        )}
      </div>

      {/* Active Consultation Cabin Card (When a patient is called into Cabin) */}
      {activePatient && (
        <div className="bg-white border-2 border-[#2555ff]/40 rounded-xl p-5 mb-5 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#2555ff]">
                Active Cabin Consultation
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[13px] font-bold text-slate-900">
                {activePatient.patient?.name}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                ({activePatient.appointmentNumber})
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActivePatient(null)}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Minimize Cabin Card
            </button>
          </div>

          {/* Patient Quick Profile & Chief Complaint */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200/80 text-[11px] mb-4">
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">MRN Reference</span>
              <span className="font-mono font-semibold text-slate-800">{activePatient.patient?.patientId || 'MRN-PENDING'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Contact</span>
              <span className="font-mono text-slate-800">{activePatient.patient?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Gender / Age</span>
              <span className="text-slate-800">{activePatient.patient?.gender || 'N/A'} • {activePatient.patient?.age || 'N/A'} yrs</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Chief Complaint</span>
              <span className="font-medium text-[#0f172a]">{activePatient.purpose || 'General Consultation'}</span>
            </div>
          </div>

          {/* Quick Vitals Recorder */}
          <div className="mb-4">
            <div className="flex items-center space-x-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-[#2555ff]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Clinical Vitals & Triage Snapshot
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Blood Pressure</span>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  placeholder="120/80"
                  className="font-mono text-[12px] font-bold text-slate-900 bg-transparent w-full focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Heart / Pulse</span>
                <input
                  type="text"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  placeholder="74 bpm"
                  className="font-mono text-[12px] font-bold text-slate-900 bg-transparent w-full focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Temperature</span>
                <input
                  type="text"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  placeholder="98.4°F"
                  className="font-mono text-[12px] font-bold text-slate-900 bg-transparent w-full focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">Oxygen SpO2</span>
                <input
                  type="text"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  placeholder="99%"
                  className="font-mono text-[12px] font-bold text-slate-900 bg-transparent w-full focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick-Fill Clinical Prescriptions & Notes */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#2555ff] flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 mr-1" />
                <span>Physician Assessment, Diagnosis & Prescription (Rx)</span>
              </label>

              {/* Quick Template Chips */}
              <div className="hidden sm:flex items-center space-x-1.5 text-[10px]">
                <span className="text-slate-400 font-medium">Quick Rx:</span>
                <button
                  type="button"
                  onClick={() => applyQuickRx('Tab Paracetamol 650mg TDS x 3 days')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                >
                  + Paracetamol 650mg
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickRx('Tab Pantoprazole 40mg OD (empty stomach) x 7 days')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                >
                  + Pantoprazole 40mg
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickRx('CBC & Lipid Profile blood investigations advised')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                >
                  + Lab Tests
                </button>
              </div>
            </div>

            <textarea
              rows="3"
              value={consultNotes}
              onChange={(e) => setConsultNotes(e.target.value)}
              placeholder="Record clinical assessment findings, diagnostic impressions, dosages, and review advice..."
              className="elite-input border-[#2555ff]/40 focus:border-[#2555ff]"
            ></textarea>
          </div>

          {/* Complete Consultation Action */}
          <div className="flex justify-end space-x-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActivePatient(null)}
              className="btn-secondary text-[12px] py-1.5 px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompleteConsultation}
              disabled={actionLoading}
              className="btn-primary text-[12px] py-1.5 px-5 flex items-center space-x-1.5 shadow-sm font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
              <span>{actionLoading ? 'Saving...' : 'Complete Consultation & Release'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Two-Column OPD Queue Matrix: Arrived Queue + Upcoming Scheduled */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Waiting Lobby Column */}
        <div className="border border-slate-200/80 rounded-xl p-4 bg-[#fcfdfe]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-800">
                Waiting In Lobby ({waitingQueue.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Checked-in Patients</span>
          </div>

          {waitingQueue.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[11px]">
              No patients currently waiting in the lobby.
            </div>
          ) : (
            <div className="space-y-2">
              {waitingQueue.map((app, index) => (
                <div
                  key={app._id}
                  className="p-3 bg-white border border-slate-200/90 rounded-lg flex items-center justify-between hover:border-slate-300 transition shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-[13px] text-slate-900 leading-tight">
                        {app.patient?.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Token: <b>{app.appointmentNumber}</b> • Slot: {app.slotStartTime} - {app.slotEndTime}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCallPatient(app)}
                    disabled={callingId === app._id}
                    title="Call this patient into cabin"
                    className="px-3 py-1 bg-blue-50 hover:bg-[#2555ff] text-[#2555ff] hover:text-white border border-blue-200/90 rounded-md text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Bell className="w-3 h-3 mr-0.5" />
                    <span>Call</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Scheduled Arrivals (Receptionist Intake View) */}
        <div className="border border-slate-200/80 rounded-xl p-4 bg-[#fcfdfe]">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-800">
                Today's Upcoming Arrivals ({scheduledQueue.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Pending Check-in</span>
          </div>

          {scheduledQueue.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-[11px]">
              All scheduled appointments for today have arrived or been handled.
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledQueue.slice(0, 5).map((app) => (
                <div
                  key={app._id}
                  className="p-3 bg-white border border-slate-200/80 rounded-lg flex items-center justify-between hover:border-slate-300 transition shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-[12px] text-slate-900">
                      {app.patient?.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {app.appointmentNumber} • {app.slotStartTime} - {app.slotEndTime}
                    </div>
                  </div>

                  {/* 1-Click Intake Check-in button */}
                  {(user.role === 'SUPER_ADMIN' || user.role === 'RECEPTIONIST') && (
                    <button
                      onClick={() => handleMarkArrived(app._id)}
                      disabled={actionLoading}
                      title="Patient arrived at front desk"
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 rounded-md text-[11px] font-semibold transition cursor-pointer"
                    >
                      Check In (Arrived)
                    </button>
                  )}
                </div>
              ))}

              {scheduledQueue.length > 5 && (
                <div className="text-center pt-1 text-[11px] text-slate-400">
                  + {scheduledQueue.length - 5} more appointments scheduled today
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpdQueuePanel;
