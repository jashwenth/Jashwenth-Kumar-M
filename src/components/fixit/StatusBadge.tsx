import React from 'react';
import { Clock, Wrench, CheckCircle2 } from 'lucide-react';
import type { ComplaintStatus } from '../../../backend/types/fixit';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const configs: Record<
    ComplaintStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    PENDING: {
      label: 'Pending',
      bg: 'bg-red-100',
      text: 'text-red-900',
      border: 'border-red-600',
      icon: <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-amber-100',
      text: 'text-amber-900',
      border: 'border-amber-600',
      icon: <Wrench className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    RESOLVED: {
      label: 'Resolved',
      bg: 'bg-emerald-100',
      text: 'text-emerald-900',
      border: 'border-emerald-600',
      icon: <CheckCircle2 className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
  };

  const conf = configs[status] || configs.PENDING;
  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-xs px-3.5 py-1.5 gap-2'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border-2 ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses} ${className}`}
      role="status"
      aria-label={`Status: ${conf.label}`}
    >
      {conf.icon}
      <span>{conf.label}</span>
    </span>
  );
}
