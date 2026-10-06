import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  LayoutDashboard,
  BarChart3,
  Component,
  Bell,
  Check,
  User,
  Shield,
  Layers,
} from 'lucide-react';
import { fixitApi } from '../../services/fixitApi';
import type { User as FixitUser, UserRole } from '../../../backend/types/fixit';

interface FixitHeaderProps {
  currentTab: 'dashboard' | 'submit' | 'detail' | 'statistics' | 'components';
  onNavigate: (tab: 'dashboard' | 'submit' | 'statistics' | 'components') => void;
  onSelectComplaint?: (id: string) => void;
}

export default function FixitHeader({
  currentTab,
  onNavigate,
  onSelectComplaint,
}: FixitHeaderProps) {
  const [currentUser, setCurrentUser] = useState<FixitUser | null>(() => fixitApi.getCurrentUser());
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    // If not logged in, default to student Alex Chen for instant frictionless hackathon usage
    if (!fixitApi.getCurrentUser()) {
      fixitApi.login({ email: 'alex@wales.edu' }).catch(() => {});
    }

    const unsub = fixitApi.subscribe(() => {
      setCurrentUser(fixitApi.getCurrentUser());
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (currentUser) {
      fixitApi.getNotifications().then((res) => setNotifications(res)).catch(() => {});
    }
  }, [currentUser]);

  const handleSwitchUserRole = async (role: UserRole) => {
    try {
      const emailMap: Record<UserRole, string> = {
        STUDENT: 'alex@wales.edu',
        STAFF: 'robert.vance@wales.edu',
        MAINTENANCE: 'dave.maintenance@wales.edu',
        ADMIN: 'admin@wales.edu',
      };
      await fixitApi.login({ email: emailMap[role] });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkNotifRead = async (id: string, complaintId?: string) => {
    await fixitApi.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (complaintId && onSelectComplaint) {
      setShowNotifMenu(false);
      onSelectComplaint(complaintId);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-white border-4 border-black rounded-3xl p-5 brutal-shadow mb-8 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Module Brand */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black text-[#C8E64D] flex items-center justify-center font-bold text-xl brutal-shadow">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-black" style={{ fontFamily: 'Lexend' }}>
                Fixit
              </span>
              <span className="text-xs font-mono font-bold bg-[#C8E64D] text-black border border-black px-2 py-0.5 rounded-full">
                Maintenance Add-on
              </span>
            </div>
            <p className="text-xs text-gray-600 font-semibold">
              Centralized Maintenance Reporting • Full-Stack REST Backend
            </p>
          </div>
        </div>

        {/* Right Actions: Persona Switcher & Notifications */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Persona quick-switch dropdown */}
          <div className="flex items-center gap-2 bg-[#F7F6F2] border-2 border-black rounded-2xl px-3 py-1.5 text-xs font-bold">
            <User className="w-3.5 h-3.5 text-black" />
            <span className="text-gray-500 uppercase text-[10px]">Active Role:</span>
            <select
              value={currentUser?.role || 'STUDENT'}
              onChange={(e) => handleSwitchUserRole(e.target.value as UserRole)}
              className="bg-transparent font-bold text-xs focus:outline-none cursor-pointer"
              aria-label="Switch active user role"
            >
              <option value="STUDENT">Alex Chen (Student)</option>
              <option value="STAFF">Dr. Robert Vance (Staff)</option>
              <option value="MAINTENANCE">Dave Miller (Maintenance)</option>
              <option value="ADMIN">Eleanor Wright (Admin)</option>
            </select>
          </div>

          {/* Notifications button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2.5 rounded-2xl border-2 border-black bg-white hover:bg-[#F7F6F2] transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-black" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifMenu && (
              <div className="absolute right-0 top-12 z-50 w-80 bg-white border-3 border-black rounded-2xl brutal-shadow p-3 space-y-2 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-black/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-black">
                    Notifications ({notifications.length})
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Auto-synced</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkNotifRead(n.id, n.complaintId)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          n.read
                            ? 'bg-[#F7F6F2] border-black/10 text-gray-600'
                            : 'bg-amber-50 border-amber-400 text-gray-900 font-bold'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="truncate">{n.title}</span>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        </div>
                        <p className="text-[11px] font-normal text-gray-600 leading-tight">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Submit Button */}
          <button
            onClick={() => onNavigate('submit')}
            className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-4 py-2 rounded-2xl text-xs font-bold border-2 border-black flex items-center gap-1.5 brutal-shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Complaint</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Pill Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t-2 border-black/10">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
            currentTab === 'dashboard'
              ? 'bg-black text-white border-black shadow-[2px_2px_0px_#000]'
              : 'bg-white hover:bg-[#F7F6F2] text-gray-700 border-black/20 hover:border-black'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Complaints Dashboard</span>
        </button>

        <button
          onClick={() => onNavigate('submit')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
            currentTab === 'submit'
              ? 'bg-black text-white border-black shadow-[2px_2px_0px_#000]'
              : 'bg-white hover:bg-[#F7F6F2] text-gray-700 border-black/20 hover:border-black'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Submit Complaint</span>
        </button>

        <button
          onClick={() => onNavigate('statistics')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
            currentTab === 'statistics'
              ? 'bg-black text-white border-black shadow-[2px_2px_0px_#000]'
              : 'bg-white hover:bg-[#F7F6F2] text-gray-700 border-black/20 hover:border-black'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Maintenance Analytics</span>
        </button>

        <button
          onClick={() => onNavigate('components')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
            currentTab === 'components'
              ? 'bg-black text-white border-black shadow-[2px_2px_0px_#000]'
              : 'bg-white hover:bg-[#F7F6F2] text-gray-700 border-black/20 hover:border-black'
          }`}
        >
          <Component className="w-3.5 h-3.5" />
          <span>Component Showcase</span>
        </button>
      </div>
    </div>
  );
}
