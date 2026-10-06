import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Flame,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Clock,
  Shield,
  Activity,
} from 'lucide-react';
import { campusStore } from '../lib/store';
import { detectRecurringPattern } from '../lib/rules';
import { LOCATIONS } from '../types/incident';
import type { Incident, Severity } from '../types/incident';

interface HeatmapViewProps {
  onSelectIncident: (id: string) => void;
  onOpenReportModal: (location?: string) => void;
}

interface BuildingMetric {
  name: string;
  total: number;
  open: number;
  criticalOrHigh: number;
  topCategory: string;
  categories: Record<string, number>;
  status: 'critical' | 'warning' | 'normal';
  description: string;
  x: number;
  y: number;
}

export default function HeatmapView({
  onSelectIncident,
  onOpenReportModal,
}: HeatmapViewProps) {
  const [incidents, setIncidents] = useState<Incident[]>(() => campusStore.getIncidents());
  const [selectedBuilding, setSelectedBuilding] = useState<string>('Block B');

  useEffect(() => {
    const unsub = campusStore.subscribe(() => {
      setIncidents(campusStore.getIncidents());
    });
    return unsub;
  }, []);

  // Compute metrics for each campus location
  const buildingMetrics: Record<string, BuildingMetric> = useMemo(() => {
    const result: Record<string, BuildingMetric> = {
      'Block A': {
        name: 'Block A',
        total: 0,
        open: 0,
        criticalOrHigh: 0,
        topCategory: 'Electrical',
        categories: {},
        status: 'warning',
        description: 'Lecture Halls, Faculty Offices & Labs',
        x: 18,
        y: 22,
      },
      'Block B': {
        name: 'Block B',
        total: 0,
        open: 0,
        criticalOrHigh: 0,
        topCategory: 'Plumbing',
        categories: {},
        status: 'critical',
        description: 'Engineering Labs, Classrooms & Washrooms (Active Hotspot)',
        x: 48,
        y: 20,
      },
      Library: {
        name: 'Library',
        total: 0,
        open: 0,
        criticalOrHigh: 0,
        topCategory: 'Facilities',
        categories: {},
        status: 'warning',
        description: 'Central Library, Reading Halls & Digital Archives',
        x: 78,
        y: 25,
      },
      Cafeteria: {
        name: 'Cafeteria',
        total: 0,
        open: 0,
        criticalOrHigh: 0,
        topCategory: 'WiFi',
        categories: {},
        status: 'warning',
        description: 'Dining Hall, Kitchens & Student Social Lounge',
        x: 22,
        y: 65,
      },
      'Hostel 1': {
        name: 'Hostel 1',
        total: 0,
        open: 0,
        criticalOrHigh: 0,
        topCategory: 'Infrastructure',
        categories: {},
        status: 'warning',
        description: "Men's Student Residence & Common Rooms",
        x: 52,
        y: 62,
      },
      'Hostel 2': {
        name: 'Hostel 2',
        total: 0,
        open: 0,
        criticalOrHigh: 0,
        topCategory: 'Cleanliness',
        categories: {},
        status: 'normal',
        description: "Women's Student Residence & Study Hall",
        x: 78,
        y: 66,
      },
      'Sports Complex': {
        name: 'Sports Complex',
        total: 0,
        open: 0,
        criticalOrHigh: 0,
        topCategory: 'Safety',
        categories: {},
        status: 'normal',
        description: 'Indoor Gymnasium, Courts & Outdoor Track',
        x: 35,
        y: 88,
      },
      'Admin Block': {
        name: 'Admin Block',
        total: 0,
        open: 0,
        criticalOrHigh: 0,
        topCategory: 'Facilities',
        categories: {},
        status: 'normal',
        description: "Chancellor's Office & Registrar Affairs",
        x: 70,
        y: 90,
      },
    };

    // Aggregate
    for (const inc of incidents) {
      const b = result[inc.location];
      if (b) {
        b.total++;
        if (inc.status !== 'Fixed') {
          b.open++;
          if (inc.severity === 'Critical' || inc.severity === 'High') {
            b.criticalOrHigh++;
          }
        }
        b.categories[inc.category] = (b.categories[inc.category] || 0) + 1;
      }
    }

    // Determine top category and status severity
    for (const key of Object.keys(result)) {
      const b = result[key];
      let maxCat = 'General';
      let maxVal = 0;
      for (const [cat, val] of Object.entries(b.categories)) {
        if (val > maxVal) {
          maxVal = val;
          maxCat = cat;
        }
      }
      b.topCategory = maxCat;

      if (b.open >= 5 || b.criticalOrHigh >= 3) {
        b.status = 'critical';
      } else if (b.open >= 2 || b.criticalOrHigh >= 1) {
        b.status = 'warning';
      } else {
        b.status = 'normal';
      }
    }

    return result;
  }, [incidents]);

  const activeMetric = buildingMetrics[selectedBuilding] || buildingMetrics['Block B'];

  const selectedBuildingIncidents = useMemo(() => {
    return incidents.filter((i) => i.location === selectedBuilding);
  }, [incidents, selectedBuilding]);

  // AI recurring pattern detection
  const recurringPattern = useMemo(() => {
    return detectRecurringPattern(incidents, selectedBuilding, activeMetric.topCategory, 14);
  }, [incidents, selectedBuilding, activeMetric]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-rose-600 animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Infrastructure Heatmap • Hotspot Detection Active
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black" style={{ fontFamily: 'Lexend' }}>
            Campus Infrastructure Spatial Intelligence
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Identifies systemic infrastructure failures, pipe junctions, and recurring maintenance hotspots across Wales University.
          </p>
        </div>

        <button
          onClick={() => onOpenReportModal(selectedBuilding)}
          className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-5 py-3 rounded-xl text-sm font-bold border-2 border-black flex items-center gap-2 brutal-shadow flex-shrink-0 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span>Report in {selectedBuilding}</span>
        </button>
      </div>

      {/* Main Grid: Interactive Map + Building Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Interactive Campus Map Canvas */}
        <div className="lg:col-span-7 bg-[#2E332B] border-4 border-black rounded-3xl p-6 brutal-shadow relative min-h-[560px] flex flex-col justify-between overflow-hidden">
          {/* Subtle grid pattern background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #C8E64D 1.5px, transparent 1.5px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Map Title Overlay */}
          <div className="relative z-10 flex items-center justify-between text-white pb-3 border-b border-white/20">
            <div>
              <span className="text-[11px] font-mono text-[#C8E64D] uppercase tracking-wider">
                WALES UNIVERSITY MAIN CAMPUS MAP
              </span>
              <h3 className="text-lg font-bold text-white">Spatial Risk Matrix</h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                Critical Hotspot
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Moderate Risk
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Stable
              </span>
            </div>
          </div>

          {/* Campus Building Cards positioned in spatial grid */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
            {Object.values(buildingMetrics).map((b) => {
              const isSelected = selectedBuilding === b.name;
              const isCritical = b.status === 'critical';
              const isWarning = b.status === 'warning';

              return (
                <div
                  key={b.name}
                  onClick={() => setSelectedBuilding(b.name)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all border-2 ${
                    isSelected
                      ? 'bg-white text-black border-[#C8E64D] ring-4 ring-[#C8E64D]/50 scale-[1.03] shadow-2xl'
                      : isCritical
                      ? 'bg-[#3b1d1d] text-white border-red-500 hover:bg-[#4a2424]'
                      : isWarning
                      ? 'bg-[#3d3319] text-white border-amber-500 hover:bg-[#4d4020]'
                      : 'bg-[#222720] text-white/90 border-white/20 hover:border-white/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-black text-[#C8E64D]'
                          : isCritical
                          ? 'bg-red-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {b.name}
                    </span>
                    {isCritical && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    )}
                  </div>

                  <h4 className="font-bold text-sm tracking-tight mb-1 truncate">{b.name}</h4>

                  <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-black/10">
                    <span className="text-[11px] font-bold">
                      {b.open} active issue{b.open === 1 ? '' : 's'}
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">
                      {b.topCategory}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Campus Map Footer Legend */}
          <div className="relative z-10 pt-3 border-t border-white/20 flex items-center justify-between text-white/70 text-xs">
            <span>Click any campus building to inspect recurring faults & analytics</span>
            <span className="font-mono text-[#C8E64D]">Active Hotspot: Block B (Plumbing Riser)</span>
          </div>
        </div>

        {/* Building Inspector Side Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Selected Building Overview Card */}
          <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-6">
            <div className="flex items-start justify-between border-b-2 border-black pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Building Diagnostics
                </span>
                <h3 className="text-3xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
                  {activeMetric.name}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">{activeMetric.description}</p>
              </div>

              <span
                className={`text-xs font-bold uppercase px-3 py-1 rounded-full border-2 border-black ${
                  activeMetric.status === 'critical'
                    ? 'bg-red-500 text-white animate-pulse'
                    : activeMetric.status === 'warning'
                    ? 'bg-amber-300 text-black'
                    : 'bg-green-300 text-black'
                }`}
              >
                {activeMetric.status} Risk
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#F7F6F2] border border-black/20 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Reports</span>
                <span className="text-2xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
                  {activeMetric.total}
                </span>
              </div>
              <div className="bg-[#F7F6F2] border border-black/20 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Open Tickets</span>
                <span className="text-2xl font-bold text-red-600" style={{ fontFamily: 'Lexend' }}>
                  {activeMetric.open}
                </span>
              </div>
              <div className="bg-[#F7F6F2] border border-black/20 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">High Priority</span>
                <span className="text-2xl font-bold text-orange-600" style={{ fontFamily: 'Lexend' }}>
                  {activeMetric.criticalOrHigh}
                </span>
              </div>
            </div>

            {/* AI Pattern Detection Notice */}
            {recurringPattern.is_recurring ? (
              <div className="bg-red-50 border-3 border-red-500 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <span>AI Systemic Failure Alert</span>
                </div>
                <p className="text-xs text-red-900 leading-relaxed font-medium">
                  {recurringPattern.message}
                </p>
                <div className="pt-2 border-t border-red-200 flex items-center justify-between text-[11px] text-red-800 font-semibold">
                  <span>Confidence: 94% Structured Pattern</span>
                  <span>Root Cause: Upstream Valve Degradation</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>No recurring infrastructure failure patterns detected in {activeMetric.name}.</span>
              </div>
            )}

            {/* Category Distribution Breakdown */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
                Incident Breakdown by Category
              </h4>
              <div className="space-y-2">
                {Object.entries(activeMetric.categories).map(([cat, count]) => {
                  const pct = activeMetric.total > 0 ? (count / activeMetric.total) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{cat}</span>
                        <span className="text-gray-500">{count} tickets ({Math.round(pct)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 border border-black/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cat === 'Plumbing'
                              ? 'bg-blue-500'
                              : cat === 'Electrical'
                              ? 'bg-amber-500'
                              : cat === 'WiFi'
                              ? 'bg-emerald-500'
                              : 'bg-purple-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Direct Tickets in this Building */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                  Tickets in {activeMetric.name} ({selectedBuildingIncidents.length})
                </h4>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedBuildingIncidents.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectIncident(t.id)}
                    className="p-3 bg-[#F7F6F2] hover:bg-[#DCE8D4] border border-black/20 hover:border-black rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono font-bold bg-black text-white px-1.5 py-0.2 rounded text-[10px]">
                          {t.id}
                        </span>
                        <span className="font-bold text-gray-900 truncate">{t.title}</span>
                      </div>
                      <span className="text-[11px] text-gray-500">{t.floor || 'Ground'} • {t.status}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
