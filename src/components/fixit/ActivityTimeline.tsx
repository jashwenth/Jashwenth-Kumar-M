import React from 'react';
import {
  FileText,
  AlertTriangle,
  UserCheck,
  Wrench,
  MessageSquare,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { ComplaintActivity, ActivityAction, UserRole } from '../../../backend/types/fixit';

interface ActivityTimelineProps {
  activities?: Array<ComplaintActivity & { user?: { name: string; role: UserRole } }>;
  loading?: boolean;
  className?: string;
}

export default function ActivityTimeline({
  activities = [],
  loading = false,
  className = '',
}: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3 p-4 bg-[#F7F6F2] rounded-2xl border-2 border-black/10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-300" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-300 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-gray-500 bg-[#F7F6F2] rounded-2xl border-2 border-dashed border-gray-300">
        No activity history recorded yet.
      </div>
    );
  }

  const getActionConfig = (action: ActivityAction) => {
    switch (action) {
      case 'COMPLAINT_SUBMITTED':
        return {
          title: 'Complaint Submitted',
          icon: <FileText className="w-4 h-4 text-black" />,
          bg: 'bg-[#DCE8D4]',
        };
      case 'PRIORITY_CHANGED':
        return {
          title: 'Priority Escalation',
          icon: <AlertTriangle className="w-4 h-4 text-orange-700" />,
          bg: 'bg-orange-100',
        };
      case 'ASSIGNED':
      case 'STAFF_ASSIGNED':
        return {
          title: 'Staff Assigned',
          icon: <UserCheck className="w-4 h-4 text-blue-700" />,
          bg: 'bg-blue-100',
        };
      case 'STATUS_CHANGED':
      case 'STATUS_UPDATED':
        return {
          title: 'Status Updated',
          icon: <Wrench className="w-4 h-4 text-amber-700" />,
          bg: 'bg-amber-100',
        };
      case 'REMARK_ADDED':
      case 'REMARKS_ADDED':
        return {
          title: 'Remark / Field Note Added',
          icon: <MessageSquare className="w-4 h-4 text-purple-700" />,
          bg: 'bg-purple-100',
        };
      case 'RESOLVED':
        return {
          title: 'Complaint Resolved',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" />,
          bg: 'bg-emerald-100',
        };
      default:
        return {
          title: action,
          icon: <Clock className="w-4 h-4 text-gray-700" />,
          bg: 'bg-gray-100',
        };
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/20">
        {activities.map((act) => {
          const conf = getActionConfig(act.action);
          const author = act.user?.name || 'System / Staff';
          const authorRole = act.user?.role;

          return (
            <div key={act.id} className="relative group">
              {/* Dot Icon */}
              <div
                className={`absolute -left-6 top-0 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center ${conf.bg} shadow-sm group-hover:scale-110 transition-transform`}
              >
                {conf.icon}
              </div>

              {/* Content Box */}
              <div className="bg-[#F7F6F2] hover:bg-white border-2 border-black/15 hover:border-black rounded-2xl p-4 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-black" style={{ fontFamily: 'Lexend' }}>
                      {conf.title}
                    </span>
                    {authorRole && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black text-[#C8E64D] uppercase">
                        {authorRole}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-gray-500">
                    {new Date(act.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-gray-800 leading-relaxed font-medium">
                  {act.details || (act.oldValue && act.newValue ? `${act.oldValue} → ${act.newValue}` : conf.title)}
                </p>

                <div className="mt-2 text-[10px] text-gray-500 flex items-center justify-between">
                  <span>Logged by: <strong>{author}</strong></span>
                  {act.oldValue && act.newValue && (
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-black/10">
                      {act.oldValue} → {act.newValue}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
