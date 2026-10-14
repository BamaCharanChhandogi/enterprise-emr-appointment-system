import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  Eye,
  AlertCircle
} from 'lucide-react';

const AppointmentList = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10
  });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [department, setDepartment] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesForm, setNotesForm] = useState({ purpose: '', notes: '', consultationNotes: '', status: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAppointments = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/appointments', {
        params: {
          page,
          limit: pagination.limit,
          search,
          status,
          department,
          startDate,
          endDate,
          sortBy,
          sortOrder
        }
      });

      if (res.data?.success) {
        setAppointments(res.data.data.appointments || []);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(1);
  }, [status, department, startDate, endDate, sortBy, sortOrder]);

  // Real-time synchronization
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      fetchAppointments(pagination.currentPage);
    };

    socket.on('appointment_event', handleUpdate);
    return () => {
      socket.off('appointment_event', handleUpdate);
    };
  }, [pagination.currentPage]);

  const handleMarkArrived = async (id) => {
    try {
      setActionLoading(true);
      await api.post(`/appointments/${id}/arrive`);
      fetchAppointments(pagination.currentPage);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Please enter cancellation reason:', 'Patient requested cancellation');
    if (!reason) return;

    try {
      setActionLoading(true);
      await api.delete(`/appointments/${id}`, { data: { reason } });
      fetchAppointments(pagination.currentPage);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      await api.put(`/appointments/${selectedApp._id}`, notesForm);
      setSelectedApp(null);
      setEditingNotes(false);
      fetchAppointments(pagination.currentPage);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update notes');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (app) => {
    setSelectedApp(app);
    setNotesForm({
      purpose: app.purpose || '',
      notes: app.notes || '',
      consultationNotes: app.consultationNotes || '',
      status: app.status
    });
    setEditingNotes(true);
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Scheduled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">Scheduled</span>;
      case 'Arrived':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">Arrived</span>;
      case 'Completed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">Cancelled</span>;
      default:
        return <span>{st}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Clinical Appointment Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Server-side filtered, sorted, and paginated records with role-based action workflows
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAppointments(1)}
              placeholder="Search by Patient Name, Phone, ID or Ref # (Press Enter)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Arrived">Arrived</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="createdAt-desc">Created Date (Newest)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-600">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <button
            onClick={() => fetchAppointments(1)}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No appointments found matching your query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Ref Number</th>
                  <th className="py-3.5 px-4">Patient Information</th>
                  <th className="py-3.5 px-4">Physician & Dept</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((app) => {
                  const isHighlighted = app._id === highlightId;
                  return (
                    <tr
                      key={app._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isHighlighted ? 'bg-amber-50/60 ring-2 ring-amber-300' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-mono font-bold text-slate-900 text-xs">
                        {app.appointmentNumber}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{app.patient?.name}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {app.patient?.patientId} • {app.patient?.phone}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800">{app.doctor?.name}</div>
                        <div className="text-xs text-blue-600 font-medium">{app.department}</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800">{app.date}</div>
                        <div className="text-xs font-semibold text-slate-500 font-mono">
                          {app.slotStartTime} - {app.slotEndTime}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs max-w-[150px] truncate text-slate-700">
                        {app.purpose || 'General Consultation'}
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(app.status)}
                      </td>

                      <td className="py-4 px-4 text-right space-x-2">
                        {/* Status workflow triggers based on roles */}
                        {(user.role === 'SUPER_ADMIN' || user.role === 'RECEPTIONIST') && app.status === 'Scheduled' && (
                          <button
                            onClick={() => handleMarkArrived(app._id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition"
                            title="Mark Patient as Arrived in Lobby"
                          >
                            Mark Arrived
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(app)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          title="View / Edit Notes"
                        >
                          Notes / Status
                        </button>

                        {(user.role === 'SUPER_ADMIN' || user.role === 'RECEPTIONIST') && app.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancel(app._id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition"
                            title="Cancel Appointment"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-bold">{appointments.length}</span> of{' '}
            <span className="font-bold">{pagination.totalItems}</span> total appointments
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchAppointments(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchAppointments(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Notes & Status Modal */}
      {editingNotes && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Appointment Details: {selectedApp.appointmentNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Patient: {selectedApp.patient?.name} • Doctor: {selectedApp.doctor?.name}
            </p>

            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Workflow Status</label>
                <select
                  value={notesForm.status}
                  onChange={(e) => setNotesForm({ ...notesForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Arrived">Arrived</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Purpose</label>
                <input
                  type="text"
                  value={notesForm.purpose}
                  onChange={(e) => setNotesForm({ ...notesForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">General Notes</label>
                <textarea
                  rows="2"
                  value={notesForm.notes}
                  onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Doctor's Consultation Notes (Clinical Summary)
                </label>
                <textarea
                  rows="3"
                  value={notesForm.consultationNotes}
                  onChange={(e) => setNotesForm({ ...notesForm, consultationNotes: e.target.value })}
                  placeholder="Diagnosis, prescription, follow-up instructions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingNotes(false);
                  setSelectedApp(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
