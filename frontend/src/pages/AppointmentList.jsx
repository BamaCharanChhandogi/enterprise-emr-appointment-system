import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

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
  const [openModal, setOpenModal] = useState(false);
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
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(1);
  }, [status, department, startDate, endDate, sortBy, sortOrder]);

  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = (data) => {
      fetchAppointments(pagination.currentPage);
      if (data?.action === 'CREATED') {
        toast.info(`New appointment booked: ${data.appointment?.appointmentNumber}`);
      } else if (data?.action === 'ARRIVED') {
        toast.success(`Patient ${data.appointment?.patient?.name} marked Arrived`);
      }
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
      toast.success('Patient checked in to lobby');
      fetchAppointments(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const reason = window.prompt('Cancellation reason:', 'Patient rescheduled');
    if (!reason) return;

    try {
      setActionLoading(true);
      await api.delete(`/appointments/${id}`, { data: { reason } });
      toast.success('Appointment cancelled. Slot freed up.');
      fetchAppointments(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      await api.put(`/appointments/${selectedApp._id}`, notesForm);
      setOpenModal(false);
      setSelectedApp(null);
      toast.success('Clinical record saved');
      fetchAppointments(pagination.currentPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (app) => {
    setSelectedApp(app);
    setNotesForm({
      purpose: app.purpose || '',
      notes: app.notes || '',
      consultationNotes: app.consultationNotes || '',
      status: app.status
    });
    setOpenModal(true);
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Scheduled':
        return <span className="badge-scheduled">Scheduled</span>;
      case 'Arrived':
        return <span className="badge-arrived">Arrived</span>;
      case 'Completed':
        return <span className="badge-completed">Completed</span>;
      case 'Cancelled':
        return <span className="badge-cancelled">Cancelled</span>;
      default:
        return <span>{st}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-[#e2e8f0] mb-5">
        <h1 className="text-[17px] font-bold text-[#0f172a] tracking-tight">Appointments Directory</h1>
        <p className="text-[12px] text-[#64748b] mt-0.5">
          {user.role === 'DOCTOR' ? 'My Assigned Consultations' : 'All Hospital Patient Appointments'}
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
              placeholder="Search patient name, phone, or appointment # (Press Enter)..."
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
                        isHighlighted ? 'bg-amber-50/70' : ''
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

                      <td className="py-3 px-4 text-[#64748b] max-w-[150px] truncate">
                        {app.purpose || 'General Consultation'}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(app.status)}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Receptionist: Mark Arrived */}
                        {(user.role === 'SUPER_ADMIN' || user.role === 'RECEPTIONIST') && app.status === 'Scheduled' && (
                          <button
                            onClick={() => handleMarkArrived(app._id)}
                            disabled={actionLoading}
                            className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-[#b45309] border border-amber-200 rounded-[4px] text-[10px] font-semibold transition"
                          >
                            Mark Arrived
                          </button>
                        )}

                        {/* Consultation Notes Modal Trigger */}
                        <button
                          onClick={() => openEditDialog(app)}
                          className="px-2 py-0.5 bg-white hover:bg-slate-50 text-[#0f172a] border border-[#e2e8f0] rounded-[4px] text-[10px] font-semibold transition"
                        >
                          {user.role === 'DOCTOR' ? 'Consultation Notes' : 'Notes'}
                        </button>

                        {/* Receptionist: Cancel */}
                        {(user.role === 'SUPER_ADMIN' || user.role === 'RECEPTIONIST') && app.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleCancel(app._id)}
                            disabled={actionLoading}
                            className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-[#b91c1c] border border-rose-200 rounded-[4px] text-[10px] font-semibold transition"
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

        {/* Pagination */}
        <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b]">
          <div>
            Showing <span className="font-semibold text-[#0f172a]">{appointments.length}</span> of{' '}
            <span className="font-semibold text-[#0f172a]">{pagination.totalItems}</span> appointments
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => fetchAppointments(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-1 rounded-[4px] border border-[#e2e8f0] bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#0f172a]" />
            </button>
            <span className="px-2 font-medium text-[#0f172a]">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchAppointments(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-1 rounded-[4px] border border-[#e2e8f0] bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[#0f172a]" />
            </button>
          </div>
        </div>
      </div>

      {/* Radix UI Consultation Notes Modal */}
      <Dialog.Root open={openModal} onOpenChange={setOpenModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#0f172a]/50 backdrop-blur-xs z-50 animate-in fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full bg-white rounded-[5px] p-6 shadow-2xl border border-[#e2e8f0] z-50">
            <Dialog.Title className="text-[15px] font-bold text-[#0f172a]">
              Clinical Consultation: {selectedApp?.appointmentNumber}
            </Dialog.Title>
            <Dialog.Description className="text-[12px] text-[#64748b] mt-0.5 mb-4">
              Patient: <b>{selectedApp?.patient?.name}</b> • Attending: <b>{selectedApp?.doctor?.name}</b>
            </Dialog.Description>

            <div className="space-y-3 text-[12px]">
              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">
                  Status Workflow
                </label>
                <select
                  value={notesForm.status}
                  onChange={(e) => setNotesForm({ ...notesForm, status: e.target.value })}
                  className="elite-input"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Arrived">Arrived (In Clinic)</option>
                  <option value="Completed">Completed (Consulted)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">
                  Chief Complaint / Purpose
                </label>
                <input
                  type="text"
                  value={notesForm.purpose}
                  onChange={(e) => setNotesForm({ ...notesForm, purpose: e.target.value })}
                  className="elite-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">
                  Reception Notes
                </label>
                <textarea
                  rows="2"
                  value={notesForm.notes}
                  onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                  className="elite-input"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#2555ff] uppercase mb-1">
                  Physician Consultation Notes & Prescription
                </label>
                <textarea
                  rows="3"
                  value={notesForm.consultationNotes}
                  onChange={(e) => setNotesForm({ ...notesForm, consultationNotes: e.target.value })}
                  placeholder="Clinical assessment, diagnosis, prescription..."
                  className="elite-input border-[#2555ff]/40 focus:border-[#2555ff]"
                ></textarea>
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="btn-secondary text-[11px] py-1 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={actionLoading}
                className="btn-primary text-[11px] py-1 px-3"
              >
                {actionLoading ? 'Saving...' : 'Save Consultation'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
};

export default AppointmentList;
