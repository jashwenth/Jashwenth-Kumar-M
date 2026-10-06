import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  Map,
  Zap,
  MessageSquare,
  ArrowRight,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import { campusStore } from '../lib/store';
import { isOverdue, formatSLARemaining } from '../lib/rules';
import type { Incident } from '../types/incident';

interface LandingPageProps {
  onOpenDashboard: () => void;
  onOpenReportModal: () => void;
  onOpenHeatmap: () => void;
  onSelectIncident: (id: string) => void;
  onOpenFixit?: () => void;
  onOpenChatbot?: () => void;
}

export default function LandingPage({
  onOpenDashboard,
  onOpenReportModal,
  onOpenHeatmap,
  onSelectIncident,
  onOpenFixit,
  onOpenChatbot,
}: LandingPageProps) {
  const [scrollY, setScrollY] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>(() => campusStore.getIncidents());

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsub = campusStore.subscribe(() => {
      setIncidents(campusStore.getIncidents());
    });
    return unsub;
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 800);

  const openCount = incidents.filter((i) => i.status === 'Open').length;
  const highPriority = incidents.filter(
    (i) => (i.severity === 'Critical' || i.severity === 'High') && i.status !== 'Fixed'
  ).length;
  const fixedCount = incidents.filter((i) => i.status === 'Fixed').length;
  const blockBLeaks = incidents.filter(
    (i) => i.location === 'Block B' && i.category === 'Plumbing' && i.status !== 'Fixed'
  ).length;

  return (
    <div className="min-h-screen bg-cp-bg text-cp-text selection:bg-cp-lime selection:text-cp-dark">
      {/* NAVBAR */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-40 glass-dark rounded-full px-3 py-2 flex items-center gap-2 border border-white/10 shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-6 px-4 text-xs font-semibold uppercase tracking-wider text-white/70">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
          <button onClick={onOpenDashboard} className="hover:text-[#C8E64D] transition-colors">
            Dashboard
          </button>
          <button onClick={onOpenHeatmap} className="hover:text-[#C8E64D] transition-colors">
            Heatmap
          </button>
          {onOpenFixit && (
            <button onClick={onOpenFixit} className="text-[#C8E64D] font-bold hover:underline transition-colors">
              Fixit Maintenance
            </button>
          )}
        </div>
        <button
          onClick={onOpenDashboard}
          className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold hover:bg-[#C8E64D] hover:scale-105 active:scale-95 transition-all shadow-md"
        >
          Launch Command Board
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative w-full h-[100vh] overflow-hidden bg-[#4a4d44]">
        {/* 3D iframe background */}
        <iframe
          src="/hero-3d.html"
          className="absolute inset-0 w-full h-full border-none pointer-events-auto"
          style={{ opacity: heroOpacity }}
          title="CampusPulse 3D Interactive Terrain"
        />

        {/* Hero Content Overlay */}
        <div
          className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center pointer-events-none p-6"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/20 backdrop-blur-md text-xs font-semibold text-white/90"
          >
            <span className="w-2 h-2 rounded-full bg-[#C8E64D] animate-ping" />
            Wales University Campus Operations
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[3.8rem] sm:text-[4.8rem] md:text-[6rem] font-light text-white leading-tight tracking-tight max-w-5xl"
            style={{ fontFamily: 'Lexend' }}
          >
            See it. Report it. <span className="text-[#C8E64D] font-normal">Resolve it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-base md:text-xl text-white/80 max-w-2xl font-light leading-relaxed"
          >
            CampusPulse transforms everyday campus issues into AI-powered operational intelligence—connecting students, maintenance technicians, and facility directors into one seamless workflow.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-10 flex flex-wrap justify-center gap-4 pointer-events-auto"
          >
            <button
              onClick={onOpenReportModal}
              className="bg-white text-black px-8 py-4 rounded-full text-base font-bold hover:bg-[#C8E64D] hover:scale-105 active:scale-95 transition-all brutal-shadow"
            >
              Report an Issue
            </button>
            <button
              onClick={onOpenDashboard}
              className="glass px-8 py-4 rounded-full text-base font-bold text-white hover:bg-white/20 transition-all border border-white/30 hover:scale-105"
            >
              Enter Live Dashboard →
            </button>
          </motion.div>
        </div>

        {/* Floating Glass Cards */}
        <motion.div
          className="absolute bottom-20 left-6 md:left-12 glass-dark p-5 rounded-2xl border border-white/10 w-64 pointer-events-auto shadow-2xl cursor-pointer hover:border-[#C8E64D]"
          onClick={onOpenDashboard}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="flex items-center gap-3 mb-1">
            <Zap className="w-5 h-5 text-[#C8E64D]" />
            <h3 className="text-white font-semibold text-sm">AI Triage Active</h3>
          </div>
          <p className="text-white/60 text-xs">98.4% structured auto-classification with SLA calculation</p>
        </motion.div>

        <motion.div
          className="absolute top-32 right-6 md:right-12 glass-dark p-5 rounded-2xl border border-white/10 w-64 pointer-events-auto shadow-2xl cursor-pointer hover:border-[#C8E64D]"
          onClick={onOpenHeatmap}
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-white font-semibold text-sm">Live Operations</h3>
          </div>
          <p className="text-white/60 text-xs font-mono">{incidents.length} active tickets tracked</p>
        </motion.div>
      </section>

      {/* SECTION 2: THE PROBLEM (Neo-Brutalism) */}
      <section className="section-padding bg-cp-bg relative z-20 -mt-6 rounded-t-[3rem] border-t-4 border-black" id="intelligence">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-cp-moss uppercase mb-4">The Philosophy</p>
          <h2
            className="text-[3.2rem] md:text-[5rem] font-bold text-cp-dark leading-[1.08] tracking-tight mb-8 max-w-4xl uppercase"
            style={{ fontFamily: 'Lexend' }}
          >
            Intelligence is built,<br />not just reported.
          </h2>
          <p className="text-xl text-cp-text-secondary max-w-3xl leading-relaxed mb-16 font-normal">
            Most campus issue forms are digital black holes where complaints vanish. CampusPulse creates a real-time operational layer that groups identical reports, predicts cascading failures, and enforces SLA countdowns.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#DCE8D4] border-4 border-black rounded-[2rem] p-8 brutal-shadow relative">
              <span className="text-5xl font-bold font-mono-id block mb-4 opacity-30">01</span>
              <h3 className="text-2xl font-bold uppercase mb-3" style={{ fontFamily: 'Lexend' }}>
                Instant AI Triage
              </h3>
              <p className="text-sm font-medium leading-relaxed text-gray-800">
                A single photo and short description generates category, severity, department assignment, and target SLA automatically.
              </p>
            </div>

            <div className="bg-white border-4 border-black rounded-[2rem] p-8 brutal-shadow relative">
              <span className="text-5xl font-bold font-mono-id block mb-4 opacity-30">02</span>
              <h3 className="text-2xl font-bold uppercase mb-3" style={{ fontFamily: 'Lexend' }}>
                Duplicate Merging
              </h3>
              <p className="text-sm font-medium leading-relaxed text-gray-800">
                When 8 students report the same broken washroom or WiFi outage, CampusPulse groups them into a single primary ticket with escalated weight.
              </p>
            </div>

            <div className="bg-[#FAF3DD] border-4 border-black rounded-[2rem] p-8 brutal-shadow relative">
              <span className="text-5xl font-bold font-mono-id block mb-4 opacity-30">03</span>
              <h3 className="text-2xl font-bold uppercase mb-3" style={{ fontFamily: 'Lexend' }}>
                Verified Fix Loop
              </h3>
              <p className="text-sm font-medium leading-relaxed text-gray-800">
                When a technician marks an issue Fixed, reporting students rate the fix. If they report the issue persists, it reopens automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: LIVE OPERATIONS DASHBOARD PREVIEW */}
      <section className="section-padding bg-white border-y-4 border-black" id="dashboard">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
                Operational Telemetry
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
                The Campus is Speaking.
              </h2>
              <p className="text-lg text-cp-text-secondary mt-2">
                Every report contributes to a live diagnostic pulse of university infrastructure.
              </p>
            </div>

            <button
              onClick={onOpenDashboard}
              className="bg-black text-white hover:bg-[#C8E64D] hover:text-black font-bold px-6 py-3 rounded-2xl border-2 border-black flex items-center gap-2 self-start md:self-auto brutal-shadow transition-colors"
            >
              <span>View Full Control Board</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            {[
              { label: 'Open Incidents', val: openCount, color: 'text-red-500' },
              { label: 'High Priority', val: highPriority, color: 'text-orange-500' },
              { label: 'Avg Resolution', val: '3h 18m', color: 'text-cp-accent' },
              { label: 'Fixed Today', val: fixedCount, color: 'text-green-500' },
            ].map((stat, i) => (
              <div
                key={i}
                className="border-3 border-black rounded-2xl p-6 hover:shadow-[4px_4px_0px_#000] transition-all bg-cp-bg"
              >
                <div className={`text-5xl font-bold mb-2 ${stat.color}`} style={{ fontFamily: 'Lexend' }}>
                  {stat.val}
                </div>
                <div className="text-xs font-bold text-cp-text-secondary uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Live Feed & Hotspot Box */}
          <div className="flex flex-col lg:flex-row gap-8 bg-cp-bg border-4 border-black rounded-[2.5rem] p-6 brutal-shadow min-h-[580px]">
            {/* Live Feed */}
            <div className="w-full lg:w-[45%] bg-white border-3 border-black rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-bold text-lg text-black">Live Incident Feed</h3>
                </div>
                <span className="text-xs font-bold text-gray-500 font-mono">
                  {incidents.slice(0, 6).length} recent
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto max-h-[460px] pr-1">
                {incidents.slice(0, 6).map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => onSelectIncident(inc.id)}
                    className="border-2 border-black rounded-xl p-3.5 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] transition-all cursor-pointer bg-white group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-mono text-[11px] font-bold bg-black text-[#C8E64D] px-2 py-0.5 rounded">
                        {inc.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-black ${
                          inc.status === 'Fixed'
                            ? 'bg-green-300 text-black'
                            : inc.status === 'In Progress'
                            ? 'bg-amber-300 text-black'
                            : 'bg-red-300 text-black'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-black line-clamp-1 mb-1">
                      {inc.title}
                    </h4>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/10">
                      <span className="font-semibold text-gray-700">
                        📍 {inc.location} • {inc.category}
                      </span>
                      <span className="font-mono text-gray-500">
                        {formatSLARemaining(inc)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hotspot Analysis Box */}
            <div className="w-full lg:w-[55%] bg-white border-3 border-black rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 bg-red-500 text-white px-3.5 py-1 rounded-full text-xs font-bold animate-pulse">
                    <Flame className="w-4 h-4" />
                    <span>SYSTEMIC HOTSPOT DETECTED</span>
                  </div>

                  <button
                    onClick={onOpenHeatmap}
                    className="text-xs font-bold text-black hover:underline flex items-center gap-1"
                  >
                    <span>View Campus Map</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-3xl mb-1 text-black" style={{ fontFamily: 'Lexend' }}>
                    Block B Infrastructure
                  </h3>
                  <p className="text-sm text-gray-600">
                    Multiple correlated student reports indicate an escalating plumbing riser failure on 2nd Floor.
                  </p>
                </div>

                {/* Bar chart */}
                <div className="bg-[#F7F6F2] rounded-2xl border-2 border-black/20 p-6 space-y-4">
                  <div className="flex justify-between items-end h-36 gap-6 pt-4">
                    {[
                      { label: 'Plumbing', val: blockBLeaks || 7, max: 7, color: 'bg-blue-600' },
                      { label: 'Electrical', val: 2, max: 7, color: 'bg-amber-500' },
                      { label: 'WiFi', val: 2, max: 7, color: 'bg-emerald-500' },
                      { label: 'HVAC', val: 1, max: 7, color: 'bg-purple-500' },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="font-bold text-xs">{bar.val}</span>
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${(bar.val / bar.max) * 100}%` }}
                          className={`w-full max-w-[50px] rounded-t-lg border-2 border-black ${bar.color}`}
                        />
                        <span className="text-xs font-bold">{bar.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-900 text-xs font-semibold leading-relaxed">
                      AI Diagnostic: Seven plumbing incidents have occurred in Block B within 48 hours. Preventive inspection of the main vertical riser recommended immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={onOpenReportModal}
                  className="flex-1 bg-black hover:bg-[#C8E64D] hover:text-black text-white text-xs font-bold py-3.5 rounded-xl border-2 border-black transition-colors"
                >
                  Report Issue in Block B
                </button>
                <button
                  onClick={onOpenHeatmap}
                  className="px-5 border-2 border-black rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  Explore All Buildings
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-28 bg-[#DCE8D4] border-t-4 border-black text-center relative overflow-hidden">
        <h2
          className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto uppercase text-black"
          style={{ fontFamily: 'Lexend' }}
        >
          Campuses that fix themselves faster.
        </h2>
        <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-black/80 font-medium">
          CampusPulse connects thousands of student observations into actionable operational intelligence in seconds.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onOpenDashboard}
            className="bg-black text-white px-10 py-5 rounded-full text-lg font-bold hover:scale-105 transition-transform brutal-shadow border-2 border-white"
          >
            Launch Command Dashboard
          </button>
          <button
            onClick={onOpenReportModal}
            className="bg-white text-black px-10 py-5 rounded-full text-lg font-bold hover:bg-[#C8E64D] hover:scale-105 transition-transform brutal-shadow border-2 border-black"
          >
            File New Issue
          </button>
        </div>
      </section>
    </div>
  );
}
