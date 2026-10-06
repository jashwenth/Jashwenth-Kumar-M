import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Plus,
  LayoutDashboard,
  MapPin,
  QrCode,
  Home,
  UserCheck,
  Shield,
  Wrench,
  Sparkles,
} from 'lucide-react';
import LandingPage from './pages/LandingPage';
import DashboardView from './components/DashboardView';
import HeatmapView from './components/HeatmapView';
import AssetRegistryView from './components/AssetRegistryView';
import ReportIssueModal from './components/ReportIssueModal';
import IncidentDetailModal from './components/IncidentDetailModal';
import ChatbotDrawer from './components/ChatbotDrawer';

// Fixit Module Components & Pages
import FixitHeader from './components/fixit/FixitHeader';
import FixitDashboard from './pages/fixit/FixitDashboard';
import SubmitComplaint from './pages/fixit/SubmitComplaint';
import ComplaintDetail from './pages/fixit/ComplaintDetail';
import FixitStatistics from './pages/fixit/FixitStatistics';
import ComponentShowcase from './pages/fixit/ComponentShowcase';
import { fixitApi } from './services/fixitApi';

import { campusStore } from './lib/store';
import type { Asset } from './types/asset';
import type { ComplaintWithDetails } from '../backend/types/fixit';

type TabType = 'landing' | 'dashboard' | 'heatmap' | 'assets' | 'fixit';
type FixitSubTab = 'dashboard' | 'submit' | 'detail' | 'statistics' | 'components';
type RoleType = 'student' | 'maintenance' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [fixitSubTab, setFixitSubTab] = useState<FixitSubTab>('dashboard');
  const [selectedFixitId, setSelectedFixitId] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<RoleType>('student');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [prefilledAsset, setPrefilledAsset] = useState<Asset | null>(null);

  // Sync route from URL on mount and handle popstate
  const syncRouteFromUrl = useCallback(() => {
    try {
      const pathname = window.location.pathname;

      if (pathname.startsWith('/fixit')) {
        setActiveTab('fixit');
        if (pathname === '/fixit/submit') {
          setFixitSubTab('submit');
        } else if (pathname === '/fixit/statistics') {
          setFixitSubTab('statistics');
        } else if (pathname === '/fixit/components') {
          setFixitSubTab('components');
        } else if (pathname.startsWith('/fixit/complaint/')) {
          const id = pathname.replace('/fixit/complaint/', '').trim();
          if (id) {
            setSelectedFixitId(id);
            setFixitSubTab('detail');
          }
        } else {
          setFixitSubTab('dashboard');
        }
        return;
      }

      // Existing query param checks
      const params = new URLSearchParams(window.location.search);
      const assetParam = params.get('asset');
      if (assetParam) {
        const found = campusStore.getAssetById(assetParam);
        if (found) {
          setPrefilledAsset(found);
          setIsReportModalOpen(true);
        }
      }

      const ticketParam = params.get('ticket') || params.get('incident');
      if (ticketParam) {
        setSelectedIncidentId(ticketParam);
      }
    } catch (e) {
      console.warn('URL route sync error:', e);
    }
  }, []);

  useEffect(() => {
    syncRouteFromUrl();
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => window.removeEventListener('popstate', syncRouteFromUrl);
  }, [syncRouteFromUrl]);

  // Navigate within Fixit with browser URL history updates
  const handleNavigateFixit = (subTab: FixitSubTab, complaintId?: string) => {
    setActiveTab('fixit');
    setFixitSubTab(subTab);

    let targetPath = '/fixit';
    if (subTab === 'submit') targetPath = '/fixit/submit';
    else if (subTab === 'statistics') targetPath = '/fixit/statistics';
    else if (subTab === 'components') targetPath = '/fixit/components';
    else if (subTab === 'detail' && complaintId) {
      setSelectedFixitId(complaintId);
      targetPath = `/fixit/complaint/${complaintId}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleOpenReportForAsset = (asset: Asset) => {
    setPrefilledAsset(asset);
    setIsReportModalOpen(true);
  };

  const handleOpenReportGeneral = () => {
    setPrefilledAsset(null);
    setIsReportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#1A1A1A] selection:bg-[#C8E64D] selection:text-black font-sans">
      {/* Sticky App Bar (Visible on all tabs or when navigated into app) */}
      {activeTab !== 'landing' && (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b-4 border-black px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            {/* Logo */}
            <div
              onClick={() => {
                setActiveTab('landing');
                window.history.pushState({}, '', '/');
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-black text-[#C8E64D] flex items-center justify-center font-bold text-lg brutal-shadow group-hover:rotate-3 transition-transform">
                CP
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg tracking-tight text-black" style={{ fontFamily: 'Lexend' }}>
                    CampusPulse
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block -mt-0.5">
                  Wales University
                </span>
              </div>
            </div>

            {/* Navigation Tabs (Including Fixit Maintenance Add-on) */}
            <nav className="flex items-center bg-[#F7F6F2] p-1 rounded-2xl border-2 border-black gap-1 text-xs font-bold">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  window.history.pushState({}, '', '/');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Command Board</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('heatmap');
                  window.history.pushState({}, '', '/');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  activeTab === 'heatmap'
                    ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Campus Heatmap</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('assets');
                  window.history.pushState({}, '', '/');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  activeTab === 'assets'
                    ? 'bg-black text-white shadow-[2px_2px_0px_#000]'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Equipment & QR</span>
              </button>

              {/* FIXIT ADD-ON TAB */}
              <button
                onClick={() => handleNavigateFixit('dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                  activeTab === 'fixit'
                    ? 'bg-black text-[#C8E64D] shadow-[2px_2px_0px_#000]'
                    : 'text-gray-700 hover:text-black'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Fixit Maintenance</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('landing');
                  window.history.pushState({}, '', '/');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-500 hover:text-black transition-colors"
                title="Back to Landing Page"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            </nav>

            {/* Right Tools: Role Switcher & New Report Button */}
            <div className="flex items-center gap-3">
              {/* Persona / Role Selector */}
              <div className="flex items-center gap-1 text-xs font-bold bg-[#F7F6F2] px-2.5 py-1.5 rounded-xl border border-black/20">
                <span className="text-gray-400 text-[10px] uppercase mr-1">Role:</span>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as RoleType)}
                  className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="student">🎓 Student View</option>
                  <option value="maintenance">🔧 Maintenance Tech</option>
                  <option value="admin">🛡️ Facility Admin</option>
                </select>
              </div>

              <button
                onClick={handleOpenReportGeneral}
                className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-4 py-2 rounded-xl text-xs font-bold border-2 border-black flex items-center gap-1.5 brutal-shadow transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Report Issue</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Tab Routing */}
      {activeTab === 'landing' ? (
        <LandingPage
          onOpenDashboard={() => {
            setActiveTab('dashboard');
            window.history.pushState({}, '', '/');
          }}
          onOpenReportModal={handleOpenReportGeneral}
          onOpenHeatmap={() => {
            setActiveTab('heatmap');
            window.history.pushState({}, '', '/');
          }}
          onOpenFixit={() => handleNavigateFixit('dashboard')}
          onSelectIncident={(id) => setSelectedIncidentId(id)}
        />
      ) : activeTab === 'fixit' ? (
        /* FIXIT MAINTENANCE MODULE */
        <main className="max-w-7xl mx-auto px-4 py-8">
          <FixitHeader
            currentTab={fixitSubTab}
            onNavigate={(sub) => handleNavigateFixit(sub)}
            onSelectComplaint={(id) => handleNavigateFixit('detail', id)}
          />

          {fixitSubTab === 'dashboard' && (
            <FixitDashboard
              onSelectComplaint={(id) => handleNavigateFixit('detail', id)}
              onOpenSubmit={() => handleNavigateFixit('submit')}
            />
          )}

          {fixitSubTab === 'submit' && (
            <SubmitComplaint
              onSuccess={(complaint) => handleNavigateFixit('detail', complaint.complaintId)}
              onCancel={() => handleNavigateFixit('dashboard')}
            />
          )}

          {fixitSubTab === 'detail' && selectedFixitId && (
            <ComplaintDetail
              complaintId={selectedFixitId}
              onBack={() => handleNavigateFixit('dashboard')}
            />
          )}

          {fixitSubTab === 'statistics' && <FixitStatistics />}

          {fixitSubTab === 'components' && <ComponentShowcase />}
        </main>
      ) : (
        /* EXISTING OPERATIONAL TABS (Dashboard, Heatmap, Assets) */
        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectIncident={(id) => setSelectedIncidentId(id)}
              onOpenReportModal={handleOpenReportGeneral}
              userRole={userRole}
            />
          )}

          {activeTab === 'heatmap' && (
            <HeatmapView
              onSelectIncident={(id) => setSelectedIncidentId(id)}
              onOpenReportModal={(loc) => {
                setPrefilledAsset(null);
                setIsReportModalOpen(true);
              }}
            />
          )}

          {activeTab === 'assets' && (
            <AssetRegistryView onReportForAsset={handleOpenReportForAsset} />
          )}
        </main>
      )}

      {/* Floating Chatbot Assistant */}
      <ChatbotDrawer />

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setPrefilledAsset(null);
        }}
        prefilledAsset={prefilledAsset}
        onSuccess={(incident) => {
          setSelectedIncidentId(incident.id);
        }}
      />

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incidentId={selectedIncidentId}
        onClose={() => setSelectedIncidentId(null)}
        userRole={userRole}
      />
    </div>
  );
}
