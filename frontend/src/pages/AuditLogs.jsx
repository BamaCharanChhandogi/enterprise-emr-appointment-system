import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

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
    if (action.includes('CREATED')) {
      return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">{action}</span>;
    }
    if (action.includes('CANCELLED')) {
      return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">{action}</span>;
    }
    if (action.includes('LOGIN')) {
      return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#2555ff]/10 text-[#2555ff] border border-[#2555ff]/20">{action}</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">{action}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a] flex items-center space-x-2">
            <Shield className="w-5 h-5 text-[#2555ff]" />
            <span>Compliance & Security Audit Trail</span>
          </h1>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Immutable log record of authentication, appointment creation, updates, and cancellations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="elite-input text-[12px] py-1.5 px-3 bg-white w-52"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="APPOINTMENT_CREATED">APPOINTMENT_CREATED</option>
            <option value="APPOINTMENT_UPDATED">APPOINTMENT_UPDATED</option>
            <option value="APPOINTMENT_CANCELLED">APPOINTMENT_CANCELLED</option>
            <option value="PATIENT_ARRIVED">PATIENT_ARRIVED</option>
            <option value="SCHEDULE_UPDATED">SCHEDULE_UPDATED</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="elite-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[13px] text-slate-500">Loading audit trail records...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-slate-500">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="elite-table-head">
                <tr>
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">User & Role</th>
                  <th className="py-3 px-5">Action</th>
                  <th className="py-3 px-5">Entity</th>
                  <th className="py-3 px-5">Payload / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-slate-500 font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-[#2555ff] font-semibold uppercase">{log.role}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-800 font-mono text-[11px]">
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ''}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px] max-w-sm truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3 bg-[#f8fafc] border-t border-slate-100 flex items-center justify-between text-[12px] text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-800">{logs.length}</span> of{' '}
            <span className="font-semibold text-slate-800">{pagination.totalItems}</span> total log entries
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => fetchLogs(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-700" />
            </button>
            <span className="px-2.5 font-medium text-slate-800 text-[12px]">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchLogs(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition shadow-2xs"
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
