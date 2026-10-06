import React from 'react';
import { MapPin, User, Calendar, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import CategoryBadge from './CategoryBadge';
import type { ComplaintWithDetails } from '../../../backend/types/fixit';

interface ComplaintCardProps {
  complaint: ComplaintWithDetails;
  onClick: () => void;
  className?: string;
}

export default function ComplaintCard({ complaint, onClick, className = '' }: ComplaintCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border-3 border-black rounded-3xl p-5 brutal-shadow hover:-translate-y-1 hover:shadow-[6px_6px_0px_#000] transition-all cursor-pointer flex flex-col justify-between group ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View complaint ${complaint.complaintId}: ${complaint.description}`}
    >
      <div>
        {/* Top Badges Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-bold bg-black text-[#C8E64D] px-2.5 py-0.5 rounded-md border border-black">
            {complaint.complaintId}
          </span>
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={complaint.priority} size="sm" />
            <StatusBadge status={complaint.status} size="sm" />
          </div>
        </div>

        {/* Category & Title */}
        <div className="mb-2">
          <CategoryBadge category={complaint.category} className="mb-2" />
          <p className="text-sm font-bold text-gray-900 group-hover:text-black line-clamp-2 leading-snug">
            {complaint.description}
          </p>
        </div>

        {/* Location Info */}
        <div className="flex items-center gap-1.5 text-xs text-gray-700 font-semibold mb-3 bg-[#F7F6F2] p-2 rounded-xl border border-black/10">
          <MapPin className="w-3.5 h-3.5 text-black flex-shrink-0" />
          <span className="truncate">
            {complaint.building}, Floor {complaint.floor}, Room {complaint.roomNumber}
          </span>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="pt-3 border-t-2 border-black/10 flex items-center justify-between text-[11px] text-gray-500 font-medium">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[120px]">{complaint.reporter?.name || 'Student'}</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[10px]">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span>{new Date(complaint.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-1 transition-transform ml-1" />
        </div>
      </div>
    </div>
  );
}
