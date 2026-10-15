import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
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

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => fetchAppointments(pagination.currentPage);
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
        return <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-[#2555ff]/10 text-[#2555ff] border border-[#2555ff]/20">Scheduled</span>;
      case 'Arrived':
        return <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Arrived</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'Cancelled':
        return <span className="px-2 py-0.5 rounded-[5px] text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return <span>{st}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="pb-4 border-b border-[#e2e8f0] mb-5">
        <h1 className="text-lg font-bold text-[#0f172a]">Appointments Directory</h1>
        <p className="text-[12px] text-[#64748b] mt-0.5">
          Server-side filtered, sorted, and paginated patient records with workflow actions
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="elite-card p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAppointments(1)}
              placeholder="Search patient, phone, MRN or ref # (Enter)..."
              className="elite-input elite-input-with-icon text-[12px]"
            />
          </div>

          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="elite-input text-[12px]"
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
              className="elite-input text-[12px]"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="createdAt-desc">Created Date (Newest)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#e2e8f0] text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#64748b]">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="elite-input py-1 px-2 text-[11px] w-auto inline-block"
            />
            <span className="text-[#94a3b8]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="elite-input py-1 px-2 text-[11px] w-auto inline-block"
            />
          </div>

          <button
            onClick={() => fetchAppointments(1)}
            className="btn-primary py-1 px-3 text-[11px]"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="elite-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[12px] text-[#64748b]">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center text-[12px] text-[#64748b]">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="elite-table-head">
                <tr>
                  <th className="py-2.5 px-4">Ref Number</th>
                  <th className="py-2.5 px-4">Patient</th>
                  <th className="py-2.5 px-4">Physician & Dept</th>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Purpose</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {appointments.map((app) => {
                  const isHighlighted = app._id === highlightId;
                  return (
                    <tr
                      key={app._id}
                      className={`hover:bg-[#f8fafc] transition-colors ${
                        isHighlighted ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[#0f172a]">
                        {app.appointmentNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0f172a]">{app.patient?.name}</div>
                        <div className="text-[11px] text-[#64748b] font-mono">
                          {app.patient?.patientId} • {app.patient?.phone}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0f172a]">{app.doctor?.name}</div>
                        <div className="text-[10px] text-[#2555ff] font-medium">{app.department}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0f172a]">{app.date}</div>
                        <div className="text-[11px] text-[#2555ff] font-semibold font-mono">
                          {app.slotStartTime} - {app.slotEndTime}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#64748b] max-w-[140px] truncate">
                        {app.purpose || 'General Consultation'}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(app.status)}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {(user.role === 'SUPER_ADMIN' || user.role === 'RECEPTIONIST') && app.status === 'Scheduled' && (
                          <button
                            onClick={() => handleMarkArrived(app._id)}
                            disabled={actionLoading}
                            className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-[5px] text-[10px] font-semibold transition"
                          >
                            Arrived
                          </button>
                        )}

                        <button
                          onClick={() => openEditModal(app)}
                          className="px-2 py-0.5 bg-white hover:bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] rounded-[5px] text-[10px] font-semibold transition"
                        >
                          Notes
                        </button>

                        {(user.role === 'SUPER_ADMIN' || user.role === 'RECEPTIONIST') && app.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancel(app._id)}
                            disabled={actionLoading}
                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-[5px] text-[10px] font-semibold transition"
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

        <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b]">
          <div>
            Showing <span className="font-semibold text-[#0f172a]">{appointments.length}</span> of{' '}
            <span className="font-semibold text-[#0f172a]">{pagination.totalItems}</span> appointments
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => fetchAppointments(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-1 rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#0f172a]" />
            </button>
            <span className="px-2 font-medium text-[#0f172a]">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchAppointments(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-1 rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[#0f172a]" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Notes Modal */}
      {editingNotes && selectedApp && (
        <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[5px] max-w-md w-full p-5 shadow-xl border border-[#e2e8f0]">
            <h3 className="text-[14px] font-bold text-[#0f172a] mb-0.5">
              Appointment #{selectedApp.appointmentNumber}
            </h3>
            <p className="text-[11px] text-[#64748b] mb-4">
              Patient: {selectedApp.patient?.name} • Physician: {selectedApp.doctor?.name}
            </p>

            <div className="space-y-3 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">Status</label>
                <select
                  value={notesForm.status}
                  onChange={(e) => setNotesForm({ ...notesForm, status: e.target.value })}
                  className="elite-input"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Arrived">Arrived</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">Purpose</label>
                <input
                  type="text"
                  value={notesForm.purpose}
                  onChange={(e) => setNotesForm({ ...notesForm, purpose: e.target.value })}
                  className="elite-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">Notes</label>
                <textarea
                  rows="2"
                  value={notesForm.notes}
                  onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                  className="elite-input"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">
                  Doctor Consultation Notes
                </label>
                <textarea
                  rows="3"
                  value={notesForm.consultationNotes}
                  onChange={(e) => setNotesForm({ ...notesForm, consultationNotes: e.target.value })}
                  placeholder="Diagnosis, prescription..."
                  className="elite-input"
                ></textarea>
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setEditingNotes(false);
                  setSelectedApp(null);
                }}
                className="btn-secondary text-[11px] py-1 px-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={actionLoading}
                className="btn-primary text-[11px] py-1 px-3"
              >
                {actionLoading ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
