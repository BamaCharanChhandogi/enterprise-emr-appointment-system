import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getSocket } from '../services/socket';

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
            Clinical Overview
          </h1>
          <p className="text-[12px] text-[#64748b] mt-0.5 font-mono">
            OPERATOR: {user?.name?.toUpperCase()} • ROLE: {user?.role}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link to="/scheduler" className="btn-secondary">
            Scheduler Matrix
          </Link>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'RECEPTIONIST') && (
            <Link to="/book" className="btn-primary">
              Book Appointment
            </Link>
          )}
        </div>
      </div>

      {/* Numerical Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="elite-card p-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] block">
            Scheduled
          </span>
          <div className="text-2xl font-bold text-[#0f172a] font-mono mt-1">{stats.scheduled}</div>
          <span className="text-[11px] text-[#2555ff] font-medium block mt-0.5">Pending intake</span>
        </div>

        <div className="elite-card p-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] block">
            In Clinic
          </span>
          <div className="text-2xl font-bold text-[#b45309] font-mono mt-1">{stats.arrived}</div>
          <span className="text-[11px] text-[#b45309] font-medium block mt-0.5">Lobby arrived</span>
        </div>

        <div className="elite-card p-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] block">
            Completed
          </span>
          <div className="text-2xl font-bold text-[#15803d] font-mono mt-1">{stats.completed}</div>
          <span className="text-[11px] text-[#15803d] font-medium block mt-0.5">Consulted</span>
        </div>

        <div className="elite-card p-4">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] block">
            Cancelled
          </span>
          <div className="text-2xl font-bold text-[#b91c1c] font-mono mt-1">{stats.cancelled}</div>
          <span className="text-[11px] text-[#b91c1c] font-medium block mt-0.5">Slots released</span>
        </div>
      </div>

      {/* Clean Tabular Stream */}
      <div className="elite-card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#0f172a]">
              Live Clinical Activity
            </span>
          </div>
          <Link to="/appointments" className="text-[11px] font-semibold text-[#2555ff] hover:underline">
            View All Records →
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[12px] text-[#64748b]">Loading clinical records...</div>
        ) : recentAppointments.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-[#64748b]">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="elite-table-head">
                <tr>
                  <th className="py-2.5 px-4">Ref Number</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Physician & Dept</th>
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
