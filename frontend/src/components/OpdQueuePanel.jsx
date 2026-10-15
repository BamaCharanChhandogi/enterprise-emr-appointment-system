import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  RefreshCw,
  Printer
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import PrintSlipModal from './PrintSlipModal';

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

  const [selectedAppForSlip, setSelectedAppForSlip] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const handlePrintSlip = (app) => {
    setSelectedAppForSlip(app);
    setPrintModalOpen(true);
  };

  // Arrived patients waiting in lobby
  const waitingQueue = appointments.filter((a) => a.status === 'Arrived');
  // Upcoming scheduled patients who haven't arrived yet
  const scheduledQueue = appointments.filter((a) => a.status === 'Scheduled');
  // Today's completed consultations
  const completedList = appointments.filter((a) => a.status === 'Completed');

  // Next patient in line
  const nextInLine = waitingQueue.length > 0 ? waitingQueue[0] : null;
  const nextScheduled = scheduledQueue.length > 0 ? scheduledQueue[0] : null;

  // Call / Announce patient action
  const handleCallPatient = (patientApp) => {
    if (!patientApp) return;

    setCallingId(patientApp._id);

    // Only Doctor enters active consultation note recording mode
    if (user?.role === 'DOCTOR') {
      setActivePatient(patientApp);
      setConsultNotes(patientApp.consultationNotes || '');
      setVitals({
        bp: '120/80',
        pulse: '74 bpm',
        temp: '98.4°F',
        spo2: '99%'
      });
    }

    playClinicalChime();

    // Broadcast across socket for lobby displays & front desk
    const socket = getSocket();
    socket.emit('call_patient', {
      appointmentId: patientApp._id,
      appointmentNumber: patientApp.appointmentNumber,
      patientName: patientApp.patient?.name || 'Patient',
      doctorName: patientApp.doctor?.name || doctorName || user?.name,
      department: patientApp.department || department,
      cabin: 'Cabin 1',
      calledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    toast.success(
      user?.role === 'RECEPTIONIST'
        ? `Announced ${patientApp.patient?.name} (Token ${patientApp.appointmentNumber}) to proceed to ${doctorName || 'Doctor Cabin'}`
        : `Calling ${patientApp.patient?.name} (Token ${patientApp.appointmentNumber}) into Cabin`
    );

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
    <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 mb-6 shadow-xs">
      {/* Header Bar (Clean, Zero Fluff Icons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Live OPD Queue & Triage
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            DATE: {today} • ATTENDING: {doctorName || user?.name}
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-amber-50 text-amber-800 border border-amber-200/90 px-3 py-1 rounded-full font-semibold">
            {waitingQueue.length} Waiting in Lobby
          </span>
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-semibold">
            {completedList.length} Consulted
          </span>
          <button
            onClick={fetchTodayQueue}
            disabled={loading}
            title="Refresh Queue"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero "Next in Line" Banner (Role-tailored for Doctor & Receptionist) */}
      <div className="my-5">
        {nextInLine ? (
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#1e40af]">
                Next in Line • Waiting in Lobby
              </div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                {nextInLine.patient?.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Token: <b>{nextInLine.appointmentNumber}</b> • Slot: {nextInLine.slotStartTime} - {nextInLine.slotEndTime}
                {nextInLine.patient?.phone && ` • Phone: ${nextInLine.patient.phone}`}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handlePrintSlip(nextInLine)}
                title="Print OPD Token Slip"
                className="btn-secondary rounded-full px-4 py-2.5 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>

              <button
                onClick={() => handleCallPatient(nextInLine)}
                disabled={callingId === nextInLine._id}
                className="btn-primary rounded-full px-6 py-2.5 text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>
                  {callingId === nextInLine._id
                    ? 'Announcing...'
                    : user?.role === 'RECEPTIONIST'
                    ? '📢 Announce to Cabin'
                    : 'Call Patient into Cabin'}
                </span>
              </button>
            </div>
          </div>
        ) : nextScheduled && (user?.role === 'RECEPTIONIST' || user?.role === 'SUPER_ADMIN') ? (
          <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#1e40af]">
                Next Scheduled Arrival • Front Desk Intake
              </div>
              <div className="text-xl font-bold text-slate-900 mt-0.5">
                {nextScheduled.patient?.name}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Slot: <b>{nextScheduled.slotStartTime} - {nextScheduled.slotEndTime}</b> • Ref: {nextScheduled.appointmentNumber}
                {nextScheduled.patient?.phone && ` • Phone: ${nextScheduled.patient.phone}`}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handlePrintSlip(nextScheduled)}
                title="Print Token Slip"
                className="btn-secondary rounded-full px-4 py-2.5 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>

              <button
                onClick={() => handleMarkArrived(nextScheduled._id)}
                disabled={actionLoading}
                className="btn-primary rounded-full px-6 py-2.5 text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>{actionLoading ? 'Checking In...' : 'Check In Patient (Mark Arrived)'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center text-slate-500 text-xs">
            Lobby Queue Clear — All arrived patients have been consulted.
          </div>
        )}
      </div>

      {/* Active Consultation Cabin Card (Physician Only) */}
      {user?.role === 'DOCTOR' && activePatient && (
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 text-xs mb-5">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">MRN Reference</span>
              <span className="font-semibold text-slate-800">{activePatient.patient?.patientId || 'MRN-PENDING'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Contact</span>
              <span className="text-slate-800">{activePatient.patient?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Gender / Age</span>
              <span className="text-slate-800">{activePatient.patient?.gender || 'N/A'} • {activePatient.patient?.age || 'N/A'} yrs</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Chief Complaint</span>
              <span className="font-semibold text-slate-900">{activePatient.purpose || 'General Consultation'}</span>
            </div>
          </div>

          {/* Quick Vitals Recorder */}
          <div className="mb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2.5">
              Clinical Vitals & Triage
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Blood Pressure</span>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                  placeholder="120/80"
                  className="text-xs font-bold text-slate-900 bg-transparent w-full focus:outline-none mt-0.5"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Heart Rate</span>
                <input
                  type="text"
                  value={vitals.pulse}
                  onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                  placeholder="74 bpm"
                  className="text-xs font-bold text-slate-900 bg-transparent w-full focus:outline-none mt-0.5"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Temperature</span>
                <input
                  type="text"
                  value={vitals.temp}
                  onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                  placeholder="98.4°F"
                  className="text-xs font-bold text-slate-900 bg-transparent w-full focus:outline-none mt-0.5"
                />
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Oxygen SpO2</span>
                <input
                  type="text"
                  value={vitals.spo2}
                  onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                  placeholder="99%"
                  className="text-xs font-bold text-slate-900 bg-transparent w-full focus:outline-none mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Quick-Fill Clinical Prescriptions & Notes */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Physician Assessment & Prescription (Rx)
              </label>

              {/* Quick Template Chips */}
              <div className="hidden sm:flex items-center space-x-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => applyQuickRx('Tab Paracetamol 650mg TDS x 3 days')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer text-[11px]"
                >
                  + Paracetamol
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickRx('Tab Pantoprazole 40mg OD (empty stomach) x 7 days')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer text-[11px]"
                >
                  + Pantoprazole
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickRx('CBC & Lipid Profile blood investigations advised')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer text-[11px]"
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
              className="elite-input rounded-2xl"
            ></textarea>
          </div>

          {/* Complete Consultation Action */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActivePatient(null)}
              className="btn-secondary rounded-full py-2 px-5 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompleteConsultation}
              disabled={actionLoading}
              className="btn-primary rounded-full py-2 px-6 text-xs font-semibold cursor-pointer"
            >
              <span>{actionLoading ? 'Saving...' : 'Complete Consultation & Release'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Two-Column OPD Queue Matrix: Arrived Queue + Upcoming Scheduled */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Waiting Lobby Column */}
        <div className="border border-slate-200/90 rounded-[22px] p-5 bg-[#fbfcfe]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Waiting in Lobby ({waitingQueue.length})
            </h3>
            <span className="text-[11px] text-slate-400">Checked-in Patients</span>
          </div>

          {waitingQueue.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No patients currently waiting in the lobby.
            </div>
          ) : (
            <div className="space-y-2.5">
              {waitingQueue.map((app, index) => (
                <div
                  key={app._id}
                  className="p-3.5 bg-white border border-slate-200/90 rounded-2xl flex items-center justify-between hover:border-slate-300 transition shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-slate-900 leading-tight">
                        {app.patient?.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Token: {app.appointmentNumber} • Slot: {app.slotStartTime} - {app.slotEndTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handlePrintSlip(app)}
                      title="Print Token Slip"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCallPatient(app)}
                      disabled={callingId === app._id}
                      title={user?.role === 'RECEPTIONIST' ? 'Announce patient to proceed to cabin' : 'Call patient into cabin'}
                      className="btn-primary rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      {user?.role === 'RECEPTIONIST' ? 'Announce' : 'Call'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Scheduled Arrivals */}
        <div className="border border-slate-200/90 rounded-[22px] p-5 bg-[#fbfcfe]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Today's Upcoming Arrivals ({scheduledQueue.length})
            </h3>
            <span className="text-[11px] text-slate-400">Scheduled Intake</span>
          </div>

          {scheduledQueue.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              All scheduled appointments for today have arrived or been handled.
            </div>
          ) : (
            <div className="space-y-2.5">
              {scheduledQueue.slice(0, 5).map((app) => (
                <div
                  key={app._id}
                  className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between hover:border-slate-300 transition shadow-2xs"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900">
                      {app.patient?.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {app.appointmentNumber} • {app.slotStartTime} - {app.slotEndTime}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handlePrintSlip(app)}
                      title="Print Token Slip"
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {(user?.role === 'SUPER_ADMIN' || user?.role === 'RECEPTIONIST') && (
                      <button
                        onClick={() => handleMarkArrived(app._id)}
                        disabled={actionLoading}
                        title="Patient arrived at front desk"
                        className="btn-secondary rounded-full px-4 py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {scheduledQueue.length > 5 && (
                <div className="text-center pt-1 text-xs text-slate-400">
                  + {scheduledQueue.length - 5} more appointments scheduled today
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Printable OPD Token Slip Modal */}
      <PrintSlipModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        appointment={selectedAppForSlip}
      />
    </div>
  );
};

export default OpdQueuePanel;
