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
  AlertCircle,
  TrendingUp,
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

        // Calculate quick summary metrics
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

    // Listen to real-time socket events for live sync
    const socket = getSocket();
    const handleLiveEvent = (data) => {
      console.log('📡 Real-time update received on Dashboard:', data);
      fetchDashboardData();
    };

    socket.on('appointment_event', handleLiveEvent);

    return () => {
      socket.off('appointment_event', handleLiveEvent);
    };
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Scheduled</span>;
      case 'Arrived':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Arrived</span>;
      case 'Completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'Cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-xs font-medium mb-3 backdrop-blur-sm border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Real-Time EMR Cluster Connected</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            {user?.role === 'SUPER_ADMIN' && 'Full administrative oversight: manage doctors, configure shifts, and audit all clinical events.'}
            {user?.role === 'RECEPTIONIST' && 'Front desk operations: search patient records, book non-conflicting slots, and register arrivals.'}
            {user?.role === 'DOCTOR' && `Clinical workstation for ${user?.department || 'Internal Medicine'}: review upcoming patients and consultation notes.`}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/scheduler"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl font-medium text-sm shadow hover:bg-blue-50 transition"
            >
              <Calendar className="w-4 h-4" />
              <span>Open Slot Scheduler</span>
            </Link>

            {(user?.role === 'SUPER_ADMIN' || user?.role === 'RECEPTIONIST') && (
              <Link
                to="/book"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600/60 hover:bg-blue-600/80 text-white rounded-xl font-medium text-sm border border-white/20 transition backdrop-blur-sm"
              >
                <Clock className="w-4 h-4" />
                <span>Book Appointment</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.scheduled}</h3>
            <p className="text-xs text-blue-600 font-medium mt-1">Pending visits</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Clinic (Arrived)</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.arrived}</h3>
            <p className="text-xs text-amber-600 font-medium mt-1">Waiting in lobby</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Consulted successfully</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancelled</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{stats.cancelled}</h3>
            <p className="text-xs text-rose-600 font-medium mt-1">Freed up for rebooking</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Appointments Stream */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Live Appointment Stream</h2>
            <p className="text-xs text-slate-500">Real-time status updates via WebSocket connection</p>
          </div>
          <Link
            to="/appointments"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading appointments...</div>
        ) : recentAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No appointments booked yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Date & Slot</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAppointments.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {app.appointmentNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{app.patient?.name}</div>
                      <div className="text-xs text-slate-400">{app.patient?.phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{app.doctor?.name}</div>
                      <div className="text-xs text-slate-400">{app.department}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{app.date}</div>
                      <div className="text-xs text-blue-600 font-semibold">{app.slotStartTime} - {app.slotEndTime}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/appointments?highlight=${app._id}`}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
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
