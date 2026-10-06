import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Plus,
  ArrowLeft,
  Building,
  Layers,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { fixitApi } from '../../services/fixitApi';
import PhotoUploader from '../../components/fixit/PhotoUploader';
import { CATEGORY_LABELS, getCategoryIcon } from '../../components/fixit/CategoryBadge';
import PriorityBadge from '../../components/fixit/PriorityBadge';
import type { ComplaintCategory, ComplaintPriority, ComplaintWithDetails } from '../../../backend/types/fixit';

interface SubmitComplaintProps {
  onSuccess: (complaint: ComplaintWithDetails) => void;
  onCancel: () => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'FURNITURE',
  'ELECTRICAL',
  'WATER_LEAKAGE',
  'CLASSROOM_MAINTENANCE',
  'OTHER',
];

const PRIORITIES: ComplaintPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const CAMPUS_BUILDINGS = ['Block A', 'Block B', 'Library', 'Cafeteria', 'Hostel 1', 'Hostel 2', 'Sports Complex', 'Admin Block'];

export default function SubmitComplaint({ onSuccess, onCancel }: SubmitComplaintProps) {
  const [category, setCategory] = useState<ComplaintCategory>('WATER_LEAKAGE');
  const [description, setDescription] = useState('');
  const [building, setBuilding] = useState('Block A');
  const [floor, setFloor] = useState('2');
  const [roomNumber, setRoomNumber] = useState('204');
  const [priority, setPriority] = useState<ComplaintPriority>('HIGH');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<ComplaintWithDetails | null>(null);

  const minChars = 10;
  const maxChars = 1000;
  const charsRemaining = maxChars - description.length;
  const isDescValid = description.trim().length >= minChars && description.trim().length <= maxChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDescValid || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await fixitApi.createComplaint({
        category,
        description: description.trim(),
        building,
        floor,
        roomNumber: roomNumber.trim(),
        priority,
        photoUrl,
      });

      setSubmittedComplaint(result);
    } catch (err: any) {
      console.error('Failed to submit complaint:', err);
      setError(err?.message || 'Unable to submit maintenance complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto bg-white border-4 border-black rounded-3xl p-8 brutal-shadow text-center space-y-6 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-full bg-[#C8E64D] border-3 border-black mx-auto flex items-center justify-center brutal-shadow">
          <CheckCircle2 className="w-10 h-10 text-black stroke-[2.5]" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Submission Confirmed
          </span>
          <h2 className="text-3xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
            Complaint Submitted Successfully
          </h2>
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
            Your complaint has been assigned a tracking ID and routed to campus facilities for immediate triage.
          </p>
        </div>

        {/* Generated ID Card */}
        <div className="bg-[#F7F6F2] border-3 border-black rounded-2xl p-6 brutal-shadow max-w-sm mx-auto text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block">
            Complaint Tracking Number
          </span>
          <div className="font-mono text-3xl font-bold bg-black text-[#C8E64D] py-2 px-4 rounded-xl border border-black inline-block">
            {submittedComplaint.complaintId}
          </div>
          <p className="text-xs text-gray-700 font-semibold pt-1">
            Location: {submittedComplaint.building}, Floor {submittedComplaint.floor}, Room {submittedComplaint.roomNumber}
          </p>
        </div>

        {/* Next Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t-2 border-black/10">
          <button
            type="button"
            onClick={() => onSuccess(submittedComplaint)}
            className="w-full sm:w-auto bg-black hover:bg-[#C8E64D] hover:text-black text-white px-6 py-3 rounded-xl text-sm font-bold border-2 border-black flex items-center justify-center gap-2 brutal-shadow transition-colors"
          >
            <span>View Complaint Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border-2 border-black text-sm font-bold hover:bg-gray-100 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Step 1 of 1 • New Work Order
        </span>
      </div>

      <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow">
        <div className="border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
            Submit Maintenance Complaint
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            Provide details of the damaged furniture, electrical failure, leak, or facility defect.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-2xl flex items-center gap-3 text-xs text-red-900 font-semibold">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
              Maintenance Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-xs font-bold transition-all text-left ${
                      isSelected
                        ? 'bg-black text-[#C8E64D] border-black shadow-[2px_2px_0px_#000] scale-[1.02]'
                        : 'bg-[#F7F6F2] hover:bg-white text-gray-800 border-black/20 hover:border-black'
                    }`}
                  >
                    {getCategoryIcon(cat, 'w-4 h-4 flex-shrink-0')}
                    <span className="truncate">{CATEGORY_LABELS[cat]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description with Character Counter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="complaint-desc" className="text-xs font-bold uppercase tracking-wider text-black">
                Problem Description *
              </label>
              <span
                className={`text-[11px] font-mono ${
                  description.length < minChars
                    ? 'text-red-600 font-bold'
                    : charsRemaining < 50
                    ? 'text-orange-600 font-bold'
                    : 'text-gray-500'
                }`}
              >
                {description.length} / {maxChars} chars (min {minChars})
              </span>
            </div>
            <textarea
              id="complaint-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Water leakage in Block A, Floor 2, Room 204 near the heating radiator valve. Floor is wet."
              className="w-full border-2 border-black rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#C8E64D] bg-[#F7F6F2]"
              required
            />
            {description.length > 0 && description.length < minChars && (
              <p className="text-[11px] text-red-600 font-semibold mt-1">
                Please enter at least {minChars - description.length} more characters.
              </p>
            )}
          </div>

          {/* Location Fields (Building, Floor, Room Number) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="building-select" className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
                Building *
              </label>
              <select
                id="building-select"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full border-2 border-black rounded-xl p-3 bg-[#F7F6F2] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
              >
                {CAMPUS_BUILDINGS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="floor-select" className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
                Floor *
              </label>
              <input
                id="floor-select"
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="e.g. 2, Ground, 4"
                className="w-full border-2 border-black rounded-xl p-3 bg-[#F7F6F2] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
                required
              />
            </div>

            <div>
              <label htmlFor="room-input" className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
                Room Number *
              </label>
              <input
                id="room-input"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 204, Lab 3, Hallway"
                className="w-full border-2 border-black rounded-xl p-3 bg-[#F7F6F2] font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
                required
              />
            </div>
          </div>

          {/* Priority Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
              Initial Urgency / Priority *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRIORITIES.map((pri) => {
                const isSelected = priority === pri;
                return (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setPriority(pri)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      isSelected
                        ? 'border-black ring-2 ring-black scale-[1.02] shadow-[2px_2px_0px_#000]'
                        : 'border-black/20 hover:border-black bg-white'
                    }`}
                  >
                    <PriorityBadge priority={pri} size="sm" className="mx-auto" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Uploader */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
              Attach Issue Photo (Optional)
            </label>
            <PhotoUploader value={photoUrl} onChange={setPhotoUrl} />
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t-2 border-black/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-5 py-3 rounded-xl border-2 border-black text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isDescValid || submitting}
              className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-8 py-3.5 rounded-xl text-sm font-bold border-2 border-black flex items-center gap-2 brutal-shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Facilities...</span>
                </>
              ) : (
                <>
                  <span>Submit Maintenance Complaint</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
