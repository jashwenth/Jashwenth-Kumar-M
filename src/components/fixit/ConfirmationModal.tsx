import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="relative w-full max-w-md bg-white border-4 border-black rounded-3xl brutal-shadow p-6 space-y-5 animate-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border-2 border-black flex items-center justify-center ${
                isDestructive ? 'bg-red-500 text-white' : 'bg-[#C8E64D] text-black'
              }`}
            >
              {isDestructive ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <h3 id="confirm-modal-title" className="text-xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-8 h-8 rounded-full border border-black flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-700 leading-relaxed font-medium">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border-2 border-black font-bold text-xs hover:bg-gray-100 transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl border-2 border-black font-bold text-xs flex items-center gap-2 transition-all brutal-shadow ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-black hover:bg-[#C8E64D] hover:text-black text-white'
            }`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
