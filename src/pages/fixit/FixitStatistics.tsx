import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { fixitApi, type StatisticsResponse } from '../../services/fixitApi';
import { CATEGORY_LABELS } from '../../components/fixit/CategoryBadge';
import StatusBadge from '../../components/fixit/StatusBadge';
import PriorityBadge from '../../components/fixit/PriorityBadge';
import CategoryBadge from '../../components/fixit/CategoryBadge';

type RangeOption = 'today' | '7d' | '30d';

const CATEGORY_COLORS: Record<string, string> = {
  FURNITURE: '#8b5cf6',
  ELECTRICAL: '#eab308',
  WATER_LEAKAGE: '#3b82f6',
  CLASSROOM_MAINTENANCE: '#10b981',
  OTHER: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#ef4444',
  IN_PROGRESS: '#f59e0b',
  RESOLVED: '#10b981',
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#9ca3af',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

export default function FixitStatistics() {
  const [range, setRange] = useState<RangeOption>('30d');
  const [stats, setStats] = useState<StatisticsResponse['statistics'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fixitApi.getStatistics(range);
      setStats(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to calculate maintenance statistics.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const categoryChartData = (stats?.complaintsByCategory || []).map((c) => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    count: c.count,
    fill: CATEGORY_COLORS[c.category] || '#000000',
  }));

  const statusChartData = (stats?.complaintsByStatus || []).map((s) => ({
    name: s.status === 'IN_PROGRESS' ? 'In Progress' : s.status === 'PENDING' ? 'Pending' : 'Resolved',
    value: s.count,
    color: STATUS_COLORS[s.status] || '#10b981',
  }));

  const priorityChartData = (stats?.complaintsByPriority || []).map((p) => ({
    name: p.priority,
    count: p.count,
    fill: PRIORITY_COLORS[p.priority] || '#3b82f6',
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Controls Bar */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
            Operational Telemetry • Real Backend Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
            Maintenance Performance & SLA Metrics
          </h1>
        </div>

        {/* Range Selector */}
        <div className="flex items-center gap-1 bg-[#F7F6F2] border-2 border-black rounded-2xl p-1 self-start sm:self-auto">
          {(['today', '7d', '30d'] as RangeOption[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === r
                  ? 'bg-black text-white shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              {r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border-4 border-black rounded-3xl p-8 brutal-shadow text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <p className="text-sm text-gray-700 font-bold">{error}</p>
          <button
            onClick={loadStats}
            className="px-5 py-2 rounded-xl bg-black text-white font-bold text-xs"
          >
            Retry
          </button>
        </div>
      ) : stats ? (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Resolution Rate */}
            <div className="bg-white border-3 border-black rounded-3xl p-5 brutal-shadow">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Resolution Rate
              </span>
              <div className="text-4xl font-bold text-emerald-600" style={{ fontFamily: 'Lexend' }}>
                {stats.resolutionRate}%
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">
                {stats.resolved} of {stats.total} complaints fixed
              </p>
            </div>

            {/* Avg Resolution Time */}
            <div className="bg-white border-3 border-black rounded-3xl p-5 brutal-shadow">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Avg Resolution Time
              </span>
              <div className="text-4xl font-bold text-blue-600" style={{ fontFamily: 'Lexend' }}>
                {stats.averageResolutionTime.formatted}
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">From submission to verify</p>
            </div>

            {/* In Progress */}
            <div className="bg-white border-3 border-black rounded-3xl p-5 brutal-shadow">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Active Work Orders
              </span>
              <div className="text-4xl font-bold text-amber-600" style={{ fontFamily: 'Lexend' }}>
                {stats.inProgress}
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">Technicians on site</p>
            </div>

            {/* Pending Backlog */}
            <div className="bg-white border-3 border-black rounded-3xl p-5 brutal-shadow">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                Pending Triage
              </span>
              <div className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Lexend' }}>
                {stats.pending}
              </div>
              <p className="text-[11px] text-gray-500 mt-1 font-medium">Awaiting dispatcher</p>
            </div>
          </div>

          {/* 30-Day Trend Chart */}
          <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <h3 className="text-lg font-bold text-black" style={{ fontFamily: 'Lexend' }}>
                  Reported vs. Resolved Incident Trend
                </h3>
                <p className="text-xs text-gray-500">Daily velocity over selected time range</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  Reported
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  Resolved
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #000',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reported"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    name="Reported"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    stroke="#16a34a"
                    strokeWidth={2}
                    fill="#22c55e"
                    fillOpacity={0.3}
                    name="Resolved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid of 3 Breakdown Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Category */}
            <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
              <h3 className="font-bold text-base text-black" style={{ fontFamily: 'Lexend' }}>
                Complaints by Category
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ed" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: '#374151' }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Complaints">
                      {categoryChartData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* By Status Donut */}
            <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
              <h3 className="font-bold text-base text-black" style={{ fontFamily: 'Lexend' }}>
                Complaints by Status
              </h3>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, idx) => (
                        <Cell key={`cell-status-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* By Priority Bar */}
            <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
              <h3 className="font-bold text-base text-black" style={{ fontFamily: 'Lexend' }}>
                Complaints by Priority
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0ed" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#374151' }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Complaints">
                      {priorityChartData.map((entry, idx) => (
                        <Cell key={`cell-pri-${idx}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Complaints Live Feed */}
          {stats?.recentComplaints && stats.recentComplaints.length > 0 && (
            <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <h3 className="font-bold text-base text-black" style={{ fontFamily: 'Lexend' }}>
                  Recent Maintenance Complaints (Live Feed)
                </h3>
                <span className="text-xs font-mono font-bold bg-[#C8E64D] text-black border border-black px-2 py-0.5 rounded-full">
                  Real-time Server State
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black bg-[#F7F6F2]">
                      <th className="p-3 font-bold uppercase text-[10px] text-gray-600">ID</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-gray-600">Category</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-gray-600">Description</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-gray-600">Location</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-gray-600">Priority</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-gray-600">Status</th>
                      <th className="p-3 font-bold uppercase text-[10px] text-gray-600">Reported</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {stats.recentComplaints.map((c) => (
                      <tr key={c.id} className="hover:bg-amber-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-black">{c.complaintId}</td>
                        <td className="p-3">
                          <CategoryBadge category={c.category} />
                        </td>
                        <td className="p-3 font-semibold text-gray-900 max-w-xs truncate">{c.description}</td>
                        <td className="p-3 text-gray-600">
                          {c.building}, Fl {c.floor}, Rm {c.roomNumber}
                        </td>
                        <td className="p-3">
                          <PriorityBadge priority={c.priority} size="sm" />
                        </td>
                        <td className="p-3">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <td className="p-3 text-gray-500 font-mono text-[11px]">
                          {new Date(c.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
