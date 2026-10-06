import React from 'react';
import {
  Armchair,
  Zap,
  Droplets,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import type { ComplaintCategory } from '../../../backend/types/fixit';

interface CategoryBadgeProps {
  category: ComplaintCategory;
  className?: string;
  showIconOnly?: boolean;
}

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  FURNITURE: 'Furniture',
  ELECTRICAL: 'Electrical',
  WATER_LEAKAGE: 'Water Leakage',
  CLASSROOM_MAINTENANCE: 'Classroom Maintenance',
  OTHER: 'Other Maintenance',
};

export function getCategoryIcon(category: ComplaintCategory, className: string = 'w-4 h-4') {
  switch (category) {
    case 'FURNITURE':
      return <Armchair className={className} />;
    case 'ELECTRICAL':
      return <Zap className={className} />;
    case 'WATER_LEAKAGE':
      return <Droplets className={className} />;
    case 'CLASSROOM_MAINTENANCE':
      return <GraduationCap className={className} />;
    case 'OTHER':
    default:
      return <HelpCircle className={className} />;
  }
}

export default function CategoryBadge({
  category,
  className = '',
  showIconOnly = false,
}: CategoryBadgeProps) {
  const label = CATEGORY_LABELS[category] || 'General';
  const icon = getCategoryIcon(category, 'w-3.5 h-3.5');

  if (showIconOnly) {
    return (
      <span
        title={label}
        className={`inline-flex items-center justify-center p-1.5 rounded-lg bg-[#F7F6F2] border border-black/20 ${className}`}
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F7F6F2] border border-black/20 text-gray-800 ${className}`}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}
