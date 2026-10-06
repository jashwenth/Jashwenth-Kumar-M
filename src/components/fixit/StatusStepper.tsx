import React from 'react';
import { Check, Clock, Wrench, CheckCircle2 } from 'lucide-react';
import type { ComplaintStatus } from '../../../backend/types/fixit';

interface StatusStepperProps {
  status: ComplaintStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  className?: string;
}

export default function StatusStepper({
  status,
  createdAt,
  updatedAt,
  resolvedAt,
  className = '',
}: StatusStepperProps) {
  const steps: Array<{
    key: ComplaintStatus;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'PENDING',
      label: 'Submitted',
      sublabel: new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      icon: <Clock className="w-4 h-4" />,
    },
    {
      key: 'IN_PROGRESS',
      label: 'In Progress',
      sublabel:
        status === 'IN_PROGRESS' || status === 'RESOLVED'
          ? updatedAt
            ? new Date(updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Assigned & under inspection'
          : 'Awaiting technician assignment',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      key: 'RESOLVED',
      label: 'Resolved',
      sublabel: resolvedAt
        ? new Date(resolvedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Pending completion',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const getStepState = (stepKey: ComplaintStatus) => {
    if (status === 'RESOLVED') return 'completed';
    if (status === 'IN_PROGRESS') {
      if (stepKey === 'PENDING') return 'completed';
      if (stepKey === 'IN_PROGRESS') return 'active';
      return 'upcoming';
    }
    // PENDING
    if (stepKey === 'PENDING') return 'active';
    return 'upcoming';
  };

  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="relative flex items-center justify-between max-w-xl mx-auto">
        {/* Connecting bar */}
        <div className="absolute left-6 right-6 top-5 h-1 bg-gray-200 -z-0">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{
              width:
                status === 'RESOLVED'
                  ? '100%'
                  : status === 'IN_PROGRESS'
                  ? '50%'
                  : '0%',
            }}
          />
        </div>

        {steps.map((step) => {
          const state = getStepState(step.key);

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-3 border-black font-bold transition-all ${
                  state === 'completed'
                    ? 'bg-[#C8E64D] text-black shadow-sm'
                    : state === 'active'
                    ? 'bg-black text-[#C8E64D] shadow-md ring-4 ring-[#C8E64D]/50'
                    : 'bg-white text-gray-400'
                }`}
              >
                {state === 'completed' ? <Check className="w-5 h-5 stroke-[3]" /> : step.icon}
              </div>

              <span
                className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                  state === 'upcoming' ? 'text-gray-400' : 'text-black'
                }`}
                style={{ fontFamily: 'Lexend' }}
              >
                {step.label}
              </span>

              <span className="text-[10px] text-gray-500 mt-0.5 max-w-[110px] leading-tight">
                {step.sublabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
