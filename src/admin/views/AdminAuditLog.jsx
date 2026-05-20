import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { toast } from 'react-hot-toast';

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ 
    page: 1, 
    action: '', 
    adminId: '', 
    targetType: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: 50,
        action: filters.action,
        adminId: filters.adminId,
        targetType: filters.targetType
      });
      const res = await api.get(`/admin/audit-log?${params}`);
      
      // Client-side date filtering if provided
      let filtered = res.logs;
      if (filters.startDate) filtered = filtered.filter(l => new Date(l.createdAt) >= new Date(filters.startDate));
      if (filters.endDate)   filtered = filtered.filter(l => new Date(l.createdAt) <= new Date(filters.endDate + 'T23:59:59'));
      if (filters.search)    filtered = filtered.filter(l => l.adminEmail.toLowerCase().includes(filters.search.toLowerCase()));

      setLogs(filtered);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.action, filters.targetType]);

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return 'red';
    if (action.includes('GRANT') || action.includes('GIFT')) return 'green';
    if (action.includes('UPDATE')) return 'blue';
    if (action.includes('SETTINGS') || action.includes('BROADCAST')) return 'amber';
    return 'gray';
  };

  const exportCSV = () => {
    const headers = ['Timestamp', 'Admin', 'Action', 'Target', 'Target ID', 'IP', 'Details'];
    const rows = logs.map(l => [
      new Date(l.createdAt).toLocaleString(),
      l.adminEmail,
      l.action,
      l.targetType,
      l.targetId || 'N/A',
      l.ip || 'Unknown',
      JSON.stringify(l.details).replace(/"/g, '""')
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { 
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' 
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-white font-heading">Security Audit Log</h2>
          <p className="text-sm text-slate-500">Track all administrative actions and system changes</p>
        </div>
        <Button onClick={exportCSV} variant="secondary" className="h-11 px-6 border-white/10 hover:bg-white/5">
          📥 Export CSV
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0d1524] p-4 rounded-2xl border border-white/5 shadow-sm">
        <select 
          className="h-10 bg-[#080e1a] border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none"
          value={filters.action}
          onChange={e => setFilters({ ...filters, action: e.target.value, page: 1 })}
        >
          <option value="">All Actions</option>
          <option value="UPDATE_USER">Update User</option>
          <option value="DELETE_USER">Delete User</option>
          <option value="GRANT_ADMIN">Grant Admin</option>
          <option value="REVOKE_ADMIN">Revoke Admin</option>
          <option value="EXTEND_SUBSCRIPTION">Extend Subscription</option>
          <option value="UPDATE_SETTINGS">Update Settings</option>
          <option value="BROADCAST">Broadcast</option>
        </select>

        <select 
          className="h-10 bg-[#080e1a] border border-white/10 rounded-xl px-4 text-xs text-white focus:outline-none"
          value={filters.targetType}
          onChange={e => setFilters({ ...filters, targetType: e.target.value, page: 1 })}
        >
          <option value="">All Targets</option>
          <option value="user">User</option>
          <option value="subscription">Subscription</option>
          <option value="settings">Settings</option>
          <option value="coupon">Coupon</option>
        </select>

        <Input 
          type="text" 
          placeholder="Search admin email..." 
          className="h-10 !bg-[#080e1a] !border-white/10 text-xs"
          value={filters.search}
          onChange={e => setFilters({ ...filters, search: e.target.value })}
        />

        <div className="flex gap-2">
          <Button className="flex-1 h-10 bg-amber-600" onClick={fetchLogs}>Filter</Button>
          <Button className="h-10 px-3" variant="secondary" onClick={() => setFilters({ page:1, action:'', adminId:'', targetType:'', search:'', startDate:'', endDate:'' })}>✕</Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-[#0d1524] border border-white/5 rounded-2xl animate-pulse" />
          ))
        ) : logs.length > 0 ? (
          <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
            {logs.map((log, idx) => (
              <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#0d1524] text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:border-amber-500/50">
                  <span className="text-[10px] font-bold">{(log.admin?.name || log.adminEmail || '?')[0].toUpperCase()}</span>
                </div>
                {/* Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/5 bg-[#0d1524] shadow-xl transition-all hover:border-white/10">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-slate-100 text-sm">
                      {log.admin?.name || 'Admin'} <span className="text-slate-500 font-normal text-xs ml-1">({log.adminEmail})</span>
                    </div>
                    <time className="font-mono text-[10px] text-slate-500">{fmtDate(log.createdAt)}</time>
                  </div>
                  <div className="text-xs text-slate-400">
                    Did <Badge variant={getActionColor(log.action)} className="mx-1 px-1.5 py-0.5 !text-[9px]">{log.action}</Badge> 
                    on <span className="text-slate-200 font-medium">{log.targetType}</span> 
                    {log.targetId && <span className="text-[10px] text-slate-600 ml-1">#{log.targetId.slice(0,8)}</span>}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-500 font-mono grid grid-cols-2 gap-2">
                      {Object.entries(log.details).map(([k, v]) => (
                        <div key={k} className="truncate">
                          <span className="text-slate-600">{k}:</span> {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-[9px] text-slate-700 flex items-center gap-1">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18" /></svg>
                    {log.ip || 'Unknown IP'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 bg-[#0d1524] rounded-2xl border border-dashed border-white/5">
            No audit logs found matching criteria
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {total > 50 && (
        <div className="flex justify-center gap-2 pt-4">
          <Button 
            disabled={filters.page <= 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            variant="secondary" size="sm"
          >← Newer</Button>
          <Button 
            disabled={logs.length < 50}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            variant="secondary" size="sm"
          >Older →</Button>
        </div>
      )}
    </div>
  );
}
