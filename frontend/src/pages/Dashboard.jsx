import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import OpdQueuePanel from '../components/OpdQueuePanel';
import DoctorClinic from './DoctorClinic';

const Dashboard = () => {
  const { user } = useAuth();

  // If Doctor logs in, strictly render their focused unified clinical workspace
  if (user?.role === 'DOCTOR') {
    return <DoctorClinic />;
  }

  const [stats, setStats] = useState({
    totalToday: 0,
    scheduled: 0,
    arrived: 0,
    completed: 0,
    cancelled: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/appointments', {
        params: {
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      });

      if (res.data?.success) {
        const apps = res.data.data.appointments || [];
        setRecentAppointments(apps);

        setStats({
          totalToday: apps.filter(a => a.date === today).length,
          scheduled: apps.filter(a => a.status === 'Scheduled').length,
          arrived: apps.filter(a => a.status === 'Arrived').length,
          completed: apps.filter(a => a.status === 'Completed').length,
          cancelled: apps.filter(a => a.status === 'Cancelled').length
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (user?.role !== 'DOCTOR') {
      api.get('/doctors').then((res) => {
        if (res.data?.success) {
          const docs = res.data.data.doctors || [];
          setDoctors(docs);
          if (docs.length > 0) setSelectedDoctorId(docs[0]._id);
        }
      }).catch((err) => console.error(err));
    }

    const socket = getSocket();
    const handleLiveEvent = () => fetchDashboardData();
    socket.on('appointment_event', handleLiveEvent);

    return () => {
      socket.off('appointment_event', handleLiveEvent);
    };
  }, [user]);

  const currentDoc = doctors.find((d) => d._id === selectedDoctorId);
  const activeDocId = user?.role === 'DOCTOR' ? user.id : selectedDoctorId;
  const activeDocName = user?.role === 'DOCTOR' ? user.name : currentDoc?.name;
  const activeDocDept = user?.role === 'DOCTOR' ? user.department : currentDoc?.department;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="badge-scheduled">Scheduled</span>;
      case 'Arrived':
        return <span className="badge-arrived">Arrived</span>;
      case 'Completed':
        return <span className="badge-completed">Completed</span>;
      case 'Cancelled':
        return <span className="badge-cancelled">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0] mb-5">
        <div>
          <h1 className="text-[17px] font-bold text-[#0f172a] tracking-tight">
            {user?.role === 'RECEPTIONIST' ? 'Front Desk & Lobby Operations' : 'Hospital Executive Overview'}
          </h1>
          <p className="text-[12px] text-[#64748b] mt-0.5 font-mono">
            OPERATOR: {user?.name?.toUpperCase()} • {user?.role === 'RECEPTIONIST' ? 'ADMISSIONS & LOBBY' : 'SYSTEM GOVERNANCE'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/scheduler" className="btn-secondary">
              Scheduler Matrix
            </Link>
          )}
          <Link to="/book" className="btn-primary">
            Book Appointment
          </Link>
        </div>
      </div>

      {/* Numerical Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="elite-card p-5 relative overflow-hidden group">
          <div className="h-1 bg-[#2555ff] absolute top-0 left-0 right-0"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Scheduled
            </span>
            <span className="w-2 h-2 rounded-full bg-[#2555ff]/80"></span>
          </div>
          <div className="text-3xl font-extrabold text-[#0f172a] font-mono mt-2 tracking-tight">
            {stats.scheduled}
          </div>
          <span className="text-[11px] text-[#2555ff] font-medium block mt-1">
            Pending intake
          </span>
        </div>

        <div className="elite-card p-5 relative overflow-hidden group">
          <div className="h-1 bg-amber-500 absolute top-0 left-0 right-0"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              In Clinic
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <div className="text-3xl font-extrabold text-amber-700 font-mono mt-2 tracking-tight">
            {stats.arrived}
          </div>
          <span className="text-[11px] text-amber-600 font-medium block mt-1">
            Lobby arrived
          </span>
        </div>

        <div className="elite-card p-5 relative overflow-hidden group">
          <div className="h-1 bg-emerald-500 absolute top-0 left-0 right-0"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Completed
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono mt-2 tracking-tight">
            {stats.completed}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium block mt-1">
            Consulted
          </span>
        </div>

        <div className="elite-card p-5 relative overflow-hidden group">
          <div className="h-1 bg-rose-500 absolute top-0 left-0 right-0"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Cancelled
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="text-3xl font-extrabold text-rose-700 font-mono mt-2 tracking-tight">
            {stats.cancelled}
          </div>
          <span className="text-[11px] text-rose-600 font-medium block mt-1">
            Slots released
          </span>
        </div>
      </div>

      {/* For Receptionist/Admin: Doctor Filter Pills (Flex-wrap with zero horizontal scrollbar) */}
      {user?.role !== 'DOCTOR' && doctors.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4 text-[12px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-1">
            Physician Queue:
          </span>
          {doctors.map((doc) => (
            <button
              key={doc._id}
              onClick={() => setSelectedDoctorId(doc._id)}
              title={doc.department}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition cursor-pointer ${
                selectedDoctorId === doc._id
                  ? 'bg-[#2555ff] text-white shadow-2xs'
                  : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              {doc.name}
            </button>
          ))}
        </div>
      )}

      {/* Live OPD Consultation & Lobby Queue Panel */}
      <OpdQueuePanel
        doctorId={activeDocId}
        doctorName={activeDocName}
        department={activeDocDept}
      />

      {/* Clean Tabular Stream */}
      <div className="elite-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#0f172a]">
              Live Clinical Activity
            </span>
          </div>
          <Link to="/appointments" className="text-[11px] font-semibold text-[#2555ff] hover:underline">
            View All Records →
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[12px] text-slate-500">Loading clinical records...</div>
        ) : recentAppointments.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-slate-500">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="elite-table-head">
                <tr>
                  <th className="py-3 px-5">Ref Number</th>
                  <th className="py-3 px-5">Patient</th>
                  <th className="py-3 px-5">Physician & Dept</th>
                  <th className="py-3 px-5">Date & Slot</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAppointments.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-medium text-[#0f172a]">
                      {app.appointmentNumber}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#0f172a]">{app.patient?.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{app.patient?.phone}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#0f172a]">{app.doctor?.name}</div>
                      <div className="text-[10px] text-[#2555ff] font-medium">{app.department}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-[#0f172a]">{app.date}</div>
                      <div className="text-[11px] text-[#2555ff] font-semibold font-mono">{app.slotStartTime} - {app.slotEndTime}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        to={`/appointments?highlight=${app._id}`}
                        className="text-[11px] font-semibold text-[#2555ff] hover:underline"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
