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
      return <span className="px-1.5 py-0.5 rounded-[5px] text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{action}</span>;
    }
    if (action.includes('CANCELLED')) {
      return <span className="px-1.5 py-0.5 rounded-[5px] text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">{action}</span>;
    }
    if (action.includes('LOGIN')) {
      return <span className="px-1.5 py-0.5 rounded-[5px] text-[10px] font-semibold bg-[#2555ff]/10 text-[#2555ff] border border-[#2555ff]/20">{action}</span>;
    }
    return <span className="px-1.5 py-0.5 rounded-[5px] text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{action}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0] mb-5">
        <div>
          <h1 className="text-lg font-bold text-[#0f172a] flex items-center space-x-2">
            <Shield className="w-4 h-4 text-[#2555ff]" />
            <span>Compliance & Security Audit Trail</span>
          </h1>
          <p className="text-[12px] text-[#64748b] mt-0.5">
            Immutable log record of authentication, appointment creation, updates, and cancellations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#64748b]" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="elite-input text-[12px] py-1 px-2.5 bg-white"
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
          <div className="py-16 text-center text-[13px] text-[#64748b]">Loading audit trail records...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#64748b]">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="elite-table-head">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">User & Role</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Payload / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3 px-4 text-[#64748b] font-mono whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0f172a]">{log.userName}</div>
                      <div className="text-[10px] text-[#2555ff] font-semibold uppercase">{log.role}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 text-[#0f172a] font-mono text-[11px]">
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ''}
                    </td>
                    <td className="py-3 px-4 text-[#64748b] font-mono text-[11px] max-w-sm truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#e2e8f0] flex items-center justify-between text-[11px] text-[#64748b]">
          <div>
            Showing <span className="font-semibold text-[#0f172a]">{logs.length}</span> of{' '}
            <span className="font-semibold text-[#0f172a]">{pagination.totalItems}</span> total log entries
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => fetchLogs(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-1 rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#0f172a]" />
            </button>
            <span className="px-2 font-medium text-[#0f172a]">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchLogs(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-1 rounded-[5px] border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-3.5 h-3.5 text-[#0f172a]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
