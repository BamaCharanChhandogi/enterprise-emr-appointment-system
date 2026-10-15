import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';
import {
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Activity,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalToday: 0,
    scheduled: 0,
    arrived: 0,
    completed: 0,
    cancelled: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/appointments', {
        params: {
          limit: 8,
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

    const socket = getSocket();
    const handleLiveEvent = () => fetchDashboardData();
    socket.on('appointment_event', handleLiveEvent);

    return () => {
      socket.off('appointment_event', handleLiveEvent);
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-[#2555ff]/10 text-[#2555ff] border border-[#2555ff]/20">Scheduled</span>;
      case 'Arrived':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Arrived</span>;
      case 'Completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'Cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0] mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a]">
            Clinical Station Overview
          </h1>
          <p className="text-[12px] text-[#64748b] mt-0.5">
            Logged in as <span className="font-semibold text-[#0f172a]">{user?.name}</span> ({user?.role})
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/scheduler" className="btn-secondary">
            <Calendar className="w-3.5 h-3.5 text-[#2555ff]" />
            <span>Open Scheduler</span>
          </Link>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'RECEPTIONIST') && (
            <Link to="/book" className="btn-primary">
              <Clock className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="elite-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">Scheduled</span>
            <Clock className="w-3.5 h-3.5 text-[#2555ff]" />
          </div>
          <div className="text-xl font-bold text-[#0f172a] mt-1">{stats.scheduled}</div>
          <div className="text-[11px] text-[#2555ff] mt-0.5">Pending visits</div>
        </div>

        <div className="elite-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">In Clinic</span>
            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-[#0f172a] mt-1">{stats.arrived}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Lobby arrived</div>
        </div>

        <div className="elite-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-[#0f172a] mt-1">{stats.completed}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Consulted</div>
        </div>

        <div className="elite-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">Cancelled</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-[#0f172a] mt-1">{stats.cancelled}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Slots freed</div>
        </div>
      </div>

      {/* Real-time Stream */}
      <div className="elite-card overflow-hidden">
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[13px] font-bold text-[#0f172a]">Live Appointment Feed</span>
          </div>
          <Link to="/appointments" className="text-[11px] font-semibold text-[#2555ff] hover:underline flex items-center space-x-1">
            <span>View Full Directory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[12px] text-[#64748b]">Loading live appointments...</div>
        ) : recentAppointments.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-[#64748b]">No appointments booked yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="elite-table-head">
                <tr>
                  <th className="py-2.5 px-4">Ref Number</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Physician</th>
                  <th className="py-2.5 px-4">Date & Slot</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {recentAppointments.map((app) => (
                  <tr key={app._id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#0f172a]">
                      {app.appointmentNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0f172a]">{app.patient?.name}</div>
                      <div className="text-[11px] text-[#64748b] font-mono">{app.patient?.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0f172a]">{app.doctor?.name}</div>
                      <div className="text-[10px] text-[#2555ff] font-medium">{app.department}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0f172a]">{app.date}</div>
                      <div className="text-[11px] text-[#2555ff] font-semibold font-mono">{app.slotStartTime} - {app.slotEndTime}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/appointments?highlight=${app._id}`}
                        className="text-[11px] font-semibold text-[#2555ff] hover:underline"
                      >
                        Inspect
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
