import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, Clock, User, ChevronLeft, ChevronRight, Activity } from 'lucide-react';

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
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">{action}</span>;
    }
    if (action.includes('CANCELLED')) {
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">{action}</span>;
    }
    if (action.includes('LOGIN')) {
      return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">{action}</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">{action}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Shield className="w-6 h-6 text-purple-600" />
            <span>Compliance & Security Audit Trail</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable log record of authentication, appointment creation, updates, and cancellations
          </p>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
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

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading audit trail records...</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No audit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Payload / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-slate-800">{log.userName}</div>
                      <div className="text-[11px] text-purple-600 font-sans font-semibold">{log.role}</div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(-6)})` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-bold">{logs.length}</span> of{' '}
            <span className="font-bold">{pagination.totalItems}</span> total log entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchLogs(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-800">
              Page {pagination.currentPage} of {pagination.totalPages || 1}
            </span>
            <button
              onClick={() => fetchLogs(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
