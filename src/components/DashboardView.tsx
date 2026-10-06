import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  Flame,
  ArrowUpRight,
  Shield,
  Layers,
  MapPin,
} from 'lucide-react';
import { campusStore } from '../lib/store';
import { formatSLARemaining, isOverdue } from '../lib/rules';
import { CATEGORIES, LOCATIONS } from '../types/incident';
import type { Incident, Status, Severity, Category } from '../types/incident';

interface DashboardViewProps {
  onSelectIncident: (id: string) => void;
  onOpenReportModal: () => void;
  userRole?: 'student' | 'maintenance' | 'admin';
}

export default function DashboardView({
  onSelectIncident,
  onOpenReportModal,
  userRole = 'student',
}: DashboardViewProps) {
  const [incidents, setIncidents] = useState<Incident[]>(() => campusStore.getIncidents());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Status>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | Severity>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | Category>('All');
  const [locationFilter, setLocationFilter] = useState<'All' | string>('All');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  React.useEffect(() => {
    const unsub = campusStore.subscribe(() => {
      setIncidents(campusStore.getIncidents());
    });
    return unsub;
  }, []);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (statusFilter !== 'All' && inc.status !== statusFilter) return false;
      if (severityFilter !== 'All' && inc.severity !== severityFilter) return false;
      if (categoryFilter !== 'All' && inc.category !== categoryFilter) return false;
      if (locationFilter !== 'All' && inc.location !== locationFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchDesc = inc.description.toLowerCase().includes(q);
        const matchId = inc.id.toLowerCase().includes(q);
        const matchLoc = inc.location.toLowerCase().includes(q);
        const matchKeywords = inc.keywords?.some((k) => k.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchId && !matchLoc && !matchKeywords) {
          return false;
        }
      }
      return true;
    });
  }, [incidents, search, statusFilter, severityFilter, categoryFilter, locationFilter]);

  // KPIs
  const openCount = incidents.filter((i) => i.status === 'Open').length;
  const inProgressCount = incidents.filter((i) => i.status === 'In Progress').length;
  const fixedCount = incidents.filter((i) => i.status === 'Fixed').length;
  const highCritCount = incidents.filter(
    (i) => (i.severity === 'Critical' || i.severity === 'High') && i.status !== 'Fixed'
  ).length;
  const overdueCount = incidents.filter((i) => isOverdue(i)).length;

  const handleAdvanceStatus = (e: React.MouseEvent, incident: Incident) => {
    e.stopPropagation();
    const nextStatus: Status =
      incident.status === 'Open'
        ? 'In Progress'
        : incident.status === 'In Progress'
        ? 'Fixed'
        : 'Open';
    campusStore.updateIncidentStatus(
      incident.id,
      nextStatus,
      userRole === 'maintenance' ? 'Field Technician' : 'Operations Admin'
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border-4 border-black rounded-3xl p-6 brutal-shadow">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Operations Control Center • Wales University
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black" style={{ fontFamily: 'Lexend' }}>
            Live Infrastructure Command
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => campusStore.resetToDefault()}
            title="Reset data to initial state"
            className="px-3.5 py-2.5 rounded-xl border-2 border-black bg-gray-100 hover:bg-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-black flex items-center gap-2 transition-all brutal-shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border-3 border-black rounded-2xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Open Tickets</span>
            <span className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div className="text-4xl font-bold text-red-600" style={{ fontFamily: 'Lexend' }}>
            {openCount}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Awaiting assignment</p>
        </div>

        <div className="bg-white border-3 border-black rounded-2xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">In Progress</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-4xl font-bold text-amber-600" style={{ fontFamily: 'Lexend' }}>
            {inProgressCount}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Technicians on site</p>
        </div>

        <div className="bg-white border-3 border-black rounded-2xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Fixed Today</span>
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </div>
          <div className="text-4xl font-bold text-green-600" style={{ fontFamily: 'Lexend' }}>
            {fixedCount}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Verified resolved</p>
        </div>

        <div className="bg-white border-3 border-black rounded-2xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">High / Critical</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-4xl font-bold text-orange-600" style={{ fontFamily: 'Lexend' }}>
            {highCritCount}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Priority escalation</p>
        </div>

        <div className="bg-white border-3 border-black rounded-2xl p-5 brutal-shadow hover:-translate-y-0.5 transition-transform col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Overdue SLA</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className={`text-4xl font-bold ${overdueCount > 0 ? 'text-rose-600' : 'text-gray-900'}`} style={{ fontFamily: 'Lexend' }}>
            {overdueCount}
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">Exceeded target window</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket ID, keywords, title, location, reporter..."
              className="w-full pl-11 pr-4 py-3 border-2 border-black rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C8E64D] bg-[#F7F6F2]"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center border-2 border-black rounded-2xl p-1 bg-[#F7F6F2] self-start md:self-auto">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-black'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/10">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
            Filters:
          </span>

          {/* Status Pills */}
          <div className="flex items-center gap-1">
            {(['All', 'Open', 'In Progress', 'Fixed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border border-black transition-all ${
                  statusFilter === st
                    ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Severity selector */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="text-xs font-bold border border-black rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="text-xs font-bold border border-black rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>

          {/* Location selector */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="text-xs font-bold border border-black rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
          >
            <option value="All">All Campus Buildings</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {(statusFilter !== 'All' ||
            severityFilter !== 'All' ||
            categoryFilter !== 'All' ||
            locationFilter !== 'All' ||
            search) && (
            <button
              onClick={() => {
                setStatusFilter('All');
                setSeverityFilter('All');
                setCategoryFilter('All');
                setLocationFilter('All');
                setSearch('');
              }}
              className="text-xs text-red-600 hover:underline font-bold ml-2"
            >
              Clear filters
            </button>
          )}

          <span className="ml-auto text-xs font-mono font-bold text-gray-500">
            Showing {filteredIncidents.length} of {incidents.length}
          </span>
        </div>
      </div>

      {/* Main View: Kanban or Table */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['Open', 'In Progress', 'Fixed'] as const).map((columnStatus) => {
            const columnTickets = filteredIncidents.filter((i) => i.status === columnStatus);
            const columnColor =
              columnStatus === 'Open'
                ? 'border-red-500 bg-red-50/40'
                : columnStatus === 'In Progress'
                ? 'border-amber-500 bg-amber-50/40'
                : 'border-green-500 bg-green-50/40';

            return (
              <div
                key={columnStatus}
                className={`border-3 border-black rounded-3xl p-5 brutal-shadow flex flex-col bg-white min-h-[550px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        columnStatus === 'Open'
                          ? 'bg-red-500'
                          : columnStatus === 'In Progress'
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                      }`}
                    />
                    <h3 className="font-bold text-lg text-black" style={{ fontFamily: 'Lexend' }}>
                      {columnStatus}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold bg-black text-white px-2 py-0.5 rounded-full">
                    {columnTickets.length}
                  </span>
                </div>

                {/* Ticket Cards List */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[700px] pr-1">
                  {columnTickets.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-gray-400 text-xs text-center border-2 border-dashed border-gray-200 rounded-2xl p-4">
                      No tickets in {columnStatus}
                    </div>
                  ) : (
                    columnTickets.map((ticket) => {
                      const ticketOverdue = isOverdue(ticket);
                      const sla = formatSLARemaining(ticket);

                      return (
                        <div
                          key={ticket.id}
                          onClick={() => onSelectIncident(ticket.id)}
                          className="bg-white border-2 border-black rounded-2xl p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] transition-all cursor-pointer group"
                        >
                          {/* Top Card Bar */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-[11px] font-bold bg-black text-[#C8E64D] px-2 py-0.5 rounded">
                              {ticket.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-black ${
                                ticket.severity === 'Critical'
                                  ? 'bg-red-500 text-white'
                                  : ticket.severity === 'High'
                                  ? 'bg-orange-400 text-black'
                                  : 'bg-yellow-200 text-black'
                              }`}
                            >
                              {ticket.severity}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="font-bold text-sm text-gray-900 group-hover:text-black mb-1 line-clamp-2">
                            {ticket.title}
                          </h4>

                          {/* Description snippet */}
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                            {ticket.description}
                          </p>

                          {/* Location & Department */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-3">
                            <span className="bg-[#F7F6F2] border border-black/10 px-2 py-0.5 rounded font-medium text-gray-700 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-black" />
                              {ticket.location} {ticket.floor ? `(${ticket.floor})` : ''}
                            </span>
                            <span className="bg-[#F7F6F2] border border-black/10 px-2 py-0.5 rounded font-medium text-gray-700">
                              {ticket.category}
                            </span>
                          </div>

                          {/* Card Footer: SLA & Quick Move Button */}
                          <div className="flex items-center justify-between pt-2 border-t border-black/10 text-[11px]">
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className={`w-3.5 h-3.5 ${ticketOverdue ? 'text-red-600' : 'text-gray-500'}`} />
                              <span className={ticketOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}>
                                {sla}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => handleAdvanceStatus(e, ticket)}
                              title="Advance status"
                              className="text-[10px] font-bold px-2 py-1 bg-black hover:bg-[#C8E64D] hover:text-black text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <span>
                                {columnStatus === 'Open' ? 'Take →' : columnStatus === 'In Progress' ? 'Resolve ✓' : 'Reopen ↺'}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border-4 border-black rounded-3xl overflow-hidden brutal-shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#DCE8D4] border-b-2 border-black font-bold uppercase tracking-wider text-black">
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Title & Issue</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">SLA Deadline</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredIncidents.map((ticket) => {
                  const overdue = isOverdue(ticket);
                  const slaText = formatSLARemaining(ticket);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectIncident(ticket.id)}
                      className="hover:bg-[#F7F6F2] cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-black">{ticket.id}</td>
                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-gray-900 truncate">{ticket.title}</div>
                        <div className="text-[11px] text-gray-500 truncate">{ticket.description}</div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border border-black ${
                            ticket.status === 'Fixed'
                              ? 'bg-green-300 text-black'
                              : ticket.status === 'In Progress'
                              ? 'bg-amber-300 text-black'
                              : 'bg-red-300 text-black'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            ticket.severity === 'Critical'
                              ? 'bg-red-100 text-red-700'
                              : ticket.severity === 'High'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {ticket.severity}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-700">
                        {ticket.location}
                        {ticket.floor ? `, ${ticket.floor}` : ''}
                      </td>
                      <td className="p-4 font-medium text-gray-700 truncate max-w-[140px]">
                        {ticket.department}
                      </td>
                      <td className="p-4">
                        <span className={`font-mono text-[11px] ${overdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                          {slaText}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => handleAdvanceStatus(e, ticket)}
                          className="px-2.5 py-1 rounded-lg bg-black text-white hover:bg-[#C8E64D] hover:text-black font-bold text-[10px] transition-colors"
                        >
                          {ticket.status === 'Open' ? 'Work' : ticket.status === 'In Progress' ? 'Fix' : 'Reopen'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
