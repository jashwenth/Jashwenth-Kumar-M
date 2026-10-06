import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Plus,
  RefreshCw,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid,
  List,
} from 'lucide-react';
import { fixitApi, type ComplaintFilterParams } from '../../services/fixitApi';
import StatusBadge from '../../components/fixit/StatusBadge';
import PriorityBadge from '../../components/fixit/PriorityBadge';
import CategoryBadge, { CATEGORY_LABELS } from '../../components/fixit/CategoryBadge';
import ComplaintCard from '../../components/fixit/ComplaintCard';
import type { ComplaintWithDetails, User as FixitUser } from '../../../backend/types/fixit';

interface FixitDashboardProps {
  onSelectComplaint: (id: string) => void;
  onOpenSubmit: () => void;
}

export default function FixitDashboard({
  onSelectComplaint,
  onOpenSubmit,
}: FixitDashboardProps) {
  const [complaints, setComplaints] = useState<ComplaintWithDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [priority, setPriority] = useState<string>('ALL');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highestPriority'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [currentUser, setCurrentUser] = useState<FixitUser | null>(() => fixitApi.getCurrentUser());

  // Statistics state for KPI summary cards
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  const fetchStats = useCallback(async () => {
    try {
      const data = await fixitApi.getStatistics('30d');
      setStats({
        total: data.total,
        pending: data.pending,
        inProgress: data.inProgress,
        resolved: data.resolved,
      });
    } catch (e) {
      console.warn('Failed to fetch stats:', e);
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ComplaintFilterParams = {
        search: search.trim() || undefined,
        category: category !== 'ALL' ? category : undefined,
        status: status !== 'ALL' ? status : undefined,
        priority: priority !== 'ALL' ? priority : undefined,
        sort,
        page,
        limit,
      };

      const res = await fixitApi.getComplaints(params);
      setComplaints(res.complaints);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Unable to connect to the server. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, priority, sort, page, limit]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const unsub = fixitApi.subscribe(() => {
      setCurrentUser(fixitApi.getCurrentUser());
      fetchComplaints();
      fetchStats();
    });
    return unsub;
  }, [fetchComplaints, fetchStats]);

  useEffect(() => {
    // Debounce search/filters
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchComplaints]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];
    if (category !== 'ALL') {
      chips.push({
        id: 'category',
        label: `Category: ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}`,
        onRemove: () => {
          setCategory('ALL');
          setPage(1);
        },
      });
    }
    if (status !== 'ALL') {
      chips.push({
        id: 'status',
        label: `Status: ${status}`,
        onRemove: () => {
          setStatus('ALL');
          setPage(1);
        },
      });
    }
    if (priority !== 'ALL') {
      chips.push({
        id: 'priority',
        label: `Priority: ${priority}`,
        onRemove: () => {
          setPriority('ALL');
          setPage(1);
        },
      });
    }
    if (search.trim()) {
      chips.push({
        id: 'search',
        label: `Search: "${search.trim()}"`,
        onRemove: () => {
          setSearch('');
          setPage(1);
        },
      });
    }
    return chips;
  }, [category, status, priority, search]);

  const clearAllFilters = () => {
    setCategory('ALL');
    setStatus('ALL');
    setPriority('ALL');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome & KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card */}
        <div className="bg-white border-3 border-black rounded-3xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Complaints
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-black" />
          </div>
          <div className="text-4xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
            {stats.total}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Logged in Fixit DB</p>
        </div>

        {/* Pending Card */}
        <div className="bg-white border-3 border-black rounded-3xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Pending
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <div className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Lexend' }}>
            {stats.pending}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Awaiting technician</p>
        </div>

        {/* In Progress Card */}
        <div className="bg-white border-3 border-black rounded-3xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              In Progress
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-4xl font-bold text-amber-600" style={{ fontFamily: 'Lexend' }}>
            {stats.inProgress}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Work order active</p>
        </div>

        {/* Resolved Card */}
        <div className="bg-white border-3 border-black rounded-3xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Resolved
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-4xl font-bold text-emerald-600" style={{ fontFamily: 'Lexend' }}>
            {stats.resolved}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Verified repairs</p>
        </div>
      </div>

      {/* Search, Filter Bar and Action Controls */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by ID (e.g. FX-1024), description, location, building..."
              className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C8E64D] bg-[#F7F6F2]"
              aria-label="Search complaints"
            />
          </div>

          {/* View mode toggle & Submit Action */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center border-2 border-black rounded-2xl p-1 bg-[#F7F6F2]">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                }`}
                title="Table view"
                aria-label="Switch to table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                }`}
                title="Cards view"
                aria-label="Switch to card view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenSubmit}
              className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-5 py-3 rounded-2xl text-xs font-bold border-2 border-black flex items-center gap-2 brutal-shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Complaint</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t-2 border-black/10">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </span>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold border-2 border-black rounded-xl px-3 py-2 bg-white focus:outline-none cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold border-2 border-black rounded-xl px-3 py-2 bg-white focus:outline-none cursor-pointer"
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            <option value="FURNITURE">Furniture</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="WATER_LEAKAGE">Water Leakage</option>
            <option value="CLASSROOM_MAINTENANCE">Classroom Maintenance</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold border-2 border-black rounded-xl px-3 py-2 bg-white focus:outline-none cursor-pointer"
            aria-label="Filter by priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Sort Selector */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="text-xs font-bold border-2 border-black rounded-xl px-3 py-2 bg-white focus:outline-none cursor-pointer ml-auto"
            aria-label="Sort complaints"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="highestPriority">Sort: Highest Priority</option>
          </select>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/10">
            <span className="text-[11px] font-bold text-gray-500">Active Filters:</span>
            {activeChips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 bg-[#F7F6F2] border border-black text-xs font-bold px-2.5 py-1 rounded-lg"
              >
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="hover:text-red-600 transition-colors p-0.5"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-bold text-red-600 hover:underline ml-2"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        // Loading Skeleton
        <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        // Error State with Retry
        <div className="bg-white border-4 border-black rounded-3xl p-10 brutal-shadow text-center space-y-4 max-w-lg mx-auto">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h3 className="text-xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
            Connection Error
          </h3>
          <p className="text-xs text-gray-600 font-medium">{error}</p>
          <button
            onClick={fetchComplaints}
            className="bg-black text-white hover:bg-[#C8E64D] hover:text-black font-bold px-6 py-2.5 rounded-xl border-2 border-black inline-flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : complaints.length === 0 ? (
        // Empty State / No Results
        <div className="bg-white border-4 border-black rounded-3xl p-12 brutal-shadow text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#F7F6F2] border-2 border-black mx-auto flex items-center justify-center">
            <Wrench className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
            {activeChips.length > 0 ? 'No Matching Complaints' : 'No Complaints Recorded'}
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            {activeChips.length > 0
              ? 'Try modifying or clearing your filter criteria to view more complaints.'
              : 'Submit a new campus maintenance complaint to get started.'}
          </p>
          {activeChips.length > 0 ? (
            <button
              onClick={clearAllFilters}
              className="px-5 py-2.5 rounded-xl border-2 border-black text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={onOpenSubmit}
              className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-6 py-2.5 rounded-xl text-xs font-bold border-2 border-black transition-colors"
            >
              Submit First Complaint
            </button>
          )}
        </div>
      ) : (
        // Loaded Data View
        <div className="space-y-6">
          {viewMode === 'table' ? (
            // Desktop Responsive Table
            <div className="hidden sm:block bg-white border-4 border-black rounded-3xl overflow-hidden brutal-shadow">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#DCE8D4] border-b-2 border-black font-bold uppercase tracking-wider text-black">
                      <th className="p-4">Complaint ID</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Problem Description</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Priority</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Reported</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {complaints.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => onSelectComplaint(c.complaintId)}
                        className="hover:bg-[#F7F6F2] cursor-pointer transition-colors group"
                      >
                        <td className="p-4 font-mono font-bold text-black">
                          <span className="group-hover:underline">{c.complaintId}</span>
                        </td>
                        <td className="p-4">
                          <CategoryBadge category={c.category} />
                        </td>
                        <td className="p-4 max-w-sm">
                          <p className="font-bold text-gray-900 group-hover:text-black line-clamp-1">
                            {c.description}
                          </p>
                        </td>
                        <td className="p-4 font-medium text-gray-700">
                          {c.building}, Fl {c.floor}, Rm {c.roomNumber}
                        </td>
                        <td className="p-4">
                          <PriorityBadge priority={c.priority} size="sm" />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <td className="p-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* Cards View (always used on mobile, or when cards view is toggled) */}
          <div className={`${viewMode === 'table' ? 'sm:hidden' : ''} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`}>
            {complaints.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                onClick={() => onSelectComplaint(c.complaintId)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border-3 border-black rounded-2xl p-4 brutal-shadow text-xs font-bold">
              <span className="text-gray-600">
                Showing page <strong className="text-black">{page}</strong> of{' '}
                <strong className="text-black">{totalPages}</strong> ({total} total complaints)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
