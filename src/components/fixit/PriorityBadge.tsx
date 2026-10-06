import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import type { ComplaintPriority } from '../../../backend/types/fixit';

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PriorityBadge({ priority, size = 'md', className = '' }: PriorityBadgeProps) {
  const configs: Record<
    ComplaintPriority,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    LOW: {
      label: 'Low',
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-400',
      icon: <ArrowDown className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    MEDIUM: {
      label: 'Medium',
      bg: 'bg-yellow-100',
      text: 'text-yellow-900',
      border: 'border-yellow-500',
      icon: <ArrowUp className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    HIGH: {
      label: 'High',
      bg: 'bg-orange-100',
      text: 'text-orange-900',
      border: 'border-orange-500',
      icon: <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
    CRITICAL: {
      label: 'Critical',
      bg: 'bg-red-500',
      text: 'text-white',
      border: 'border-black',
      icon: <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />,
    },
  };

  const conf = configs[priority] || configs.MEDIUM;
  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] px-2 py-0.5 gap-1'
      : size === 'lg'
      ? 'text-xs px-3.5 py-1.5 gap-2'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border-2 ${conf.bg} ${conf.text} ${conf.border} ${sizeClasses} ${className}`}
      aria-label={`Priority: ${conf.label}`}
    >
      {conf.icon}
      <span>{conf.label}</span>
    </span>
  );
}
