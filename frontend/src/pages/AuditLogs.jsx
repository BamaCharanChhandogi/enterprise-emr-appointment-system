import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, ChevronLeft, ChevronRight, Filter, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 15
  });
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/audit-logs', {
        params: {
          page,
          limit: pagination.limit,
          action: actionFilter || undefined
        }
      });
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#1e40af] border border-blue-200/80">
            User Login
          </span>
        );
      case 'APPOINTMENT_CREATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            Appointment Booked
          </span>
        );
      case 'APPOINTMENT_UPDATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            Consultation Updated
          </span>
        );
      case 'APPOINTMENT_CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80">
            Cancelled Slot
          </span>
        );
      case 'PATIENT_ARRIVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80">
            Lobby Intake
          </span>
        );
      case 'SCHEDULE_UPDATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/80">
            Shift Reconfigured
          </span>
        );
      case 'DOCTOR_CREATED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-800 border border-cyan-200/80">
            Doctor Onboarded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200">
            {action.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  const getEntityLabel = (entity, entityId) => {
    let readableEntity = entity;
    if (entity === 'Appointment') readableEntity = 'Clinical Appointment';
    if (entity === 'User') readableEntity = 'User Profile';
    if (entity === 'DoctorSchedule') readableEntity = 'Doctor Shift Plan';
    if (entity === 'Patient') readableEntity = 'Patient Record';

    return (
      <div className="leading-tight">
        <span className="font-semibold text-slate-800 block text-[12px]">{readableEntity}</span>
        {entityId && (
          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
            Ref: {entityId.length > 12 ? `#${entityId.slice(-6)}` : entityId}
          </span>
        )}
      </div>
    );
  };

  const renderLogDetails = (log) => {
    const d = log.details || {};

    if (log.action === 'LOGIN') {
      return (
        <div className="flex items-center space-x-2 text-slate-700">
          <span>
            Authenticated staff account <strong className="text-slate-900 font-semibold">{d.email || log.userName}</strong>
          </span>
          {d.ip && (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
              IP: {d.ip}
            </span>
          )}
        </div>
      );
    }

    if (log.action === 'PATIENT_ARRIVED') {
      return (
        <div className="text-slate-700 leading-snug">
          <span>
            Patient <strong className="text-slate-900 font-semibold">{d.patient || 'Patient'}</strong> checked in to lobby queue
          </span>
          {d.checkedInAt && (
            <span className="text-slate-500 text-[11px] ml-1.5 font-mono">
              at {d.checkedInAt}
            </span>
          )}
          {d.token && (
            <span className="text-[#1e40af] font-mono font-semibold text-[11px] ml-1.5">
              (Token: {d.token})
            </span>
          )}
        </div>
      );
    }

    if (log.action === 'APPOINTMENT_CREATED') {
      return (
        <div className="text-slate-700 leading-snug">
          <span>
            Slot booked for <strong className="text-slate-900 font-semibold">{d.patient || d.patientName}</strong>
          </span>
          {d.doctor && (
            <span className="text-slate-600"> with {d.doctor}</span>
          )}
          {d.slot && (
            <span className="text-[#1e40af] font-mono font-semibold ml-1.5">
              [{d.slot}]
            </span>
          )}
        </div>
      );
    }

    if (log.action === 'APPOINTMENT_UPDATED') {
      return (
        <div className="text-slate-700 leading-snug">
          <span>
            Consultation notes recorded for <strong className="text-slate-900 font-semibold">{d.patient || 'Patient'}</strong>
          </span>
          {d.vitals && (
            <span className="text-emerald-700 font-medium ml-1.5">
              • Vitals: {d.vitals}
            </span>
          )}
        </div>
      );
    }

    if (log.action === 'APPOINTMENT_CANCELLED') {
      return (
        <div className="text-slate-700 leading-snug">
          <span className="text-rose-700 font-semibold">Cancellation Reason: </span>
          <span className="text-slate-800">
            {d.reason ? `"${d.reason}"` : 'Cancelled by hospital staff'}
          </span>
        </div>
      );
    }

    if (log.action === 'SCHEDULE_UPDATED') {
      return (
        <div className="text-slate-700 leading-snug">
          <span>
            Weekly shift updated for <strong className="text-slate-900 font-semibold">{d.doctor || 'Physician'}</strong>
          </span>
          {d.slotDuration && (
            <span className="text-slate-500 ml-1.5 font-mono">
              ({d.slotDuration} min slots • {d.activeDays || 7} working days)
            </span>
          )}
        </div>
      );
    }

    if (log.action === 'DOCTOR_CREATED') {
      return (
        <div className="text-slate-700 leading-snug">
          <span>
            Onboarded <strong className="text-slate-900 font-semibold">{d.doctorName}</strong>
          </span>
          {d.department && (
            <span className="text-blue-700 font-medium ml-1.5">
              ({d.department})
            </span>
          )}
        </div>
      );
    }

    // Fallback: render formatted key-value badges instead of raw JSON
    const entries = Object.entries(d);
    if (entries.length === 0) {
      return <span className="text-slate-400 italic">No additional event details</span>;
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {entries.map(([key, val]) => (
          <span
            key={key}
            className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] border border-slate-200/60"
          >
            <span className="text-slate-400 mr-1 capitalize font-medium">
              {key.replace(/([A-Z])/g, ' $1')}:
            </span>
            <span className="font-semibold text-slate-800">
              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-6">
        <div>
          <h1 className="text-[17px] font-bold text-[#0f172a] flex items-center space-x-2 tracking-tight">
            <Shield className="w-5 h-5 text-[#1e40af]" />
            <span>Compliance & Security Audit Trail</span>
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Immutable chronological ledger of authentication, patient intake, consultations, and schedule governance
          </p>
        </div>

        {/* Clean Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="elite-input text-[12px] py-1.5 px-3 bg-white w-56 rounded-xl border border-slate-200"
          >
            <option value="">All Audit Events</option>
            <option value="LOGIN">User Logins</option>
            <option value="APPOINTMENT_CREATED">Booked Appointments</option>
            <option value="PATIENT_ARRIVED">Lobby Intakes (Check-in)</option>
            <option value="APPOINTMENT_UPDATED">Completed Consultations</option>
            <option value="APPOINTMENT_CANCELLED">Slot Cancellations</option>
            <option value="SCHEDULE_UPDATED">Doctor Shift Updates</option>
            <option value="DOCTOR_CREATED">Doctor Onboarding</option>
          </select>
        </div>
      </div>

      {/* Audit Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-[24px] overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-[12px] text-slate-500">
            Loading compliance audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-[12px] text-slate-500">
            No audit records found matching selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="elite-table-head">
                <tr>
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Staff Personnel</th>
                  <th className="py-3.5 px-5">Action Type</th>
                  <th className="py-3.5 px-5">Target Record</th>
                  <th className="py-3.5 px-5">Clinical & Audit Event Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-[#1e40af] font-semibold uppercase">
                        {log.role?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {getEntityLabel(log.entity, log.entityId)}
                    </td>
                    <td className="py-3.5 px-5 text-[12px]">
                      {renderLogDetails(log)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-[#fbfcfe] border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{logs.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.totalItems}</span> total compliance records
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => fetchLogs(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
            </button>
            <span className="px-2.5 font-medium text-slate-800 text-[12px]">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchLogs(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
