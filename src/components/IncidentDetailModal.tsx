import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  MapPin,
  Building,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  History,
  QrCode,
  Star,
  ThumbsUp,
  Tag,
  Share2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { campusStore } from '../lib/store';
import { formatSLARemaining, isOverdue } from '../lib/rules';
import type { Incident, Status, ActivityLog } from '../types/incident';
import type { Asset, ResolutionFeedback } from '../types/asset';

interface IncidentDetailModalProps {
  incidentId: string | null;
  onClose: () => void;
  userRole?: 'student' | 'maintenance' | 'admin';
}

export default function IncidentDetailModal({
  incidentId,
  onClose,
  userRole = 'student',
}: IncidentDetailModalProps) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [feedback, setFeedback] = useState<ResolutionFeedback | null>(null);

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isActuallyFixed, setIsActuallyFixed] = useState(true);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    if (!incidentId) return;

    const loadData = () => {
      const inc = campusStore.getIncidentById(incidentId);
      setIncident(inc);
      if (inc) {
        setLogs(campusStore.getActivityLogs(inc.id));
        setFeedback(campusStore.getFeedback(inc.id));
        if (inc.asset_id) {
          setAsset(campusStore.getAssetById(inc.asset_id));
        } else {
          setAsset(null);
        }
      }
    };

    loadData();
    const unsub = campusStore.subscribe(loadData);
    return unsub;
  }, [incidentId]);

  if (!incidentId || !incident) return null;

  const overdue = isOverdue(incident);
  const slaText = formatSLARemaining(incident);

  const handleStatusChange = (newStatus: Status) => {
    const actor =
      userRole === 'maintenance'
        ? 'Field Technician'
        : userRole === 'admin'
        ? 'Campus Operations Admin'
        : 'Alex Chen (Student)';
    campusStore.updateIncidentStatus(incident.id, newStatus, actor);
  };

  const handleUpvote = () => {
    campusStore.upvoteIncident(incident.id, 'Alex Chen (Student)');
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    campusStore.submitResolutionFeedback(
      {
        incident_id: incident.id,
        rating,
        comment,
        is_issue_actually_fixed: isActuallyFixed,
      },
      'Alex Chen (Student)'
    );
    setFeedbackSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white border-4 border-black rounded-3xl brutal-shadow overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-[#DCE8D4] border-b-4 border-black p-6 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-sm font-bold bg-black text-[#C8E64D] px-2.5 py-1 rounded-md">
                {incident.id}
              </span>
              <span
                className={`text-xs font-bold uppercase px-3 py-1 rounded-full border-2 border-black ${
                  incident.status === 'Fixed'
                    ? 'bg-green-400 text-black'
                    : incident.status === 'In Progress'
                    ? 'bg-amber-300 text-black'
                    : 'bg-red-400 text-black'
                }`}
              >
                {incident.status}
              </span>
              <span
                className={`text-xs font-bold uppercase px-3 py-1 rounded-full border-2 border-black ${
                  incident.severity === 'Critical'
                    ? 'bg-red-500 text-white'
                    : incident.severity === 'High'
                    ? 'bg-orange-400 text-black'
                    : 'bg-yellow-200 text-black'
                }`}
              >
                {incident.severity} Severity
              </span>
              {incident.report_count > 1 && (
                <span className="text-xs font-bold bg-white text-black border border-black px-2.5 py-1 rounded-full">
                  🔥 {incident.report_count} Reports Merged
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-black" style={{ fontFamily: 'Lexend' }}>
              {incident.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border-2 border-black bg-white flex items-center justify-center hover:bg-black hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SLA countdown bar */}
          <div
            className={`flex items-center justify-between p-4 rounded-2xl border-2 border-black ${
              incident.status === 'Fixed'
                ? 'bg-green-50 border-green-600 text-green-900'
                : overdue
                ? 'bg-red-50 border-red-600 text-red-900 animate-pulse'
                : 'bg-amber-50 border-amber-500 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">
                SLA Status: {slaText}
              </span>
            </div>
            <div className="text-xs font-medium">
              Target SLA: {incident.sla_hours}h • Reported{' '}
              {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Description & Photo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${incident.image_url ? 'md:col-span-2' : 'md:col-span-3'} space-y-4`}>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Incident Description
                </h4>
                <p className="text-base text-gray-900 font-medium bg-[#F7F6F2] p-4 rounded-xl border border-black/10">
                  {incident.description}
                </p>
              </div>

              {/* AI Triage Card */}
              {incident.ai_summary && (
                <div className="bg-[#F0FDF4] border-2 border-green-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-800 text-xs font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>CampusPulse AI Assessment</span>
                  </div>
                  <p className="text-sm text-green-950 font-semibold mb-2">
                    {incident.ai_summary}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-white border border-green-300 px-2 py-0.5 rounded font-medium">
                      Category: <strong>{incident.category}</strong>
                    </span>
                    <span className="bg-white border border-green-300 px-2 py-0.5 rounded font-medium">
                      Dept: <strong>{incident.department}</strong>
                    </span>
                    {incident.keywords?.map((k, idx) => (
                      <span key={idx} className="bg-green-100 text-green-800 font-mono px-1.5 py-0.5 rounded text-[10px]">
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {incident.image_url && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Photo Evidence
                </h4>
                <div className="border-2 border-black rounded-xl overflow-hidden bg-black/5 aspect-square">
                  <img src={incident.image_url} alt="Incident Attachment" className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#F7F6F2] border-2 border-black/20 text-xs">
            <div>
              <span className="text-gray-500 font-bold block uppercase text-[10px]">Location</span>
              <span className="font-bold text-gray-900 text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-black" />
                {incident.location}
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-bold block uppercase text-[10px]">Floor</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                {incident.floor || 'Unspecified'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-bold block uppercase text-[10px]">Reporter</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block truncate">
                {incident.reporter_name || 'Anonymous Student'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-bold block uppercase text-[10px]">Department</span>
              <span className="font-bold text-gray-900 text-sm mt-0.5 block truncate" title={incident.department}>
                {incident.department}
              </span>
            </div>
          </div>

          {/* Linked Asset & QR info */}
          {asset && (
            <div className="border-2 border-black rounded-2xl p-4 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-black" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Linked Physical Asset
                  </span>
                  <span className="text-[10px] font-mono bg-black text-[#C8E64D] px-2 py-0.5 rounded">
                    {asset.id}
                  </span>
                </div>
                <h4 className="font-bold text-base text-gray-900">{asset.name}</h4>
                <p className="text-xs text-gray-600">
                  Model: {asset.model || 'Standard'} • Serial: {asset.serial_number || 'N/A'} • Warranty:{' '}
                  {asset.warranty_expiry || 'Active'}
                </p>
              </div>
              <div className="p-2 border border-black rounded-xl bg-[#F7F6F2] flex-shrink-0">
                <QRCodeSVG value={`https://campuspulse.wales.edu/report?asset=${asset.id}`} size={64} />
              </div>
            </div>
          )}

          {/* Operational Workflow Actions (For Techs / Admin or Quick Demo) */}
          <div className="border-2 border-black rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <span>Workflow & Status Transitions</span>
              </h4>
              <span className="text-[11px] font-bold text-gray-500">
                Role: <span className="uppercase text-black underline">{userRole}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('Open')}
                disabled={incident.status === 'Open'}
                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 border-black transition-all ${
                  incident.status === 'Open'
                    ? 'bg-red-400 text-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white hover:bg-red-50 text-gray-700'
                }`}
              >
                Mark as Open
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('In Progress')}
                disabled={incident.status === 'In Progress'}
                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 border-black transition-all ${
                  incident.status === 'In Progress'
                    ? 'bg-amber-300 text-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white hover:bg-amber-50 text-gray-700'
                }`}
              >
                Start Work (In Progress)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('Fixed')}
                disabled={incident.status === 'Fixed'}
                className={`px-4 py-2 rounded-xl text-xs font-bold border-2 border-black transition-all ${
                  incident.status === 'Fixed'
                    ? 'bg-green-400 text-black shadow-[2px_2px_0px_#000]'
                    : 'bg-white hover:bg-green-50 text-gray-700'
                }`}
              >
                Resolve & Verify (Fixed)
              </button>

              <button
                type="button"
                onClick={handleUpvote}
                className="ml-auto px-4 py-2 rounded-xl text-xs font-bold bg-[#C8E64D] hover:bg-[#b2d13b] text-black border-2 border-black flex items-center gap-1.5 transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Upvote / Confirm ({incident.report_count})</span>
              </button>
            </div>
          </div>

          {/* Student Resolution Feedback Form (When Fixed) */}
          {incident.status === 'Fixed' && (
            <div className="border-2 border-black rounded-2xl p-5 bg-[#F9F9F6] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-black" style={{ fontFamily: 'Lexend' }}>
                    Student Resolution Verification
                  </h4>
                  <p className="text-xs text-gray-600">
                    Did maintenance actually resolve this issue on site?
                  </p>
                </div>
                {feedback && (
                  <span className="text-xs font-bold bg-green-100 text-green-800 border border-green-300 px-2.5 py-1 rounded-full">
                    ✓ Feedback Recorded
                  </span>
                )}
              </div>

              {feedback ? (
                <div className="bg-white border border-black/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= feedback.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-800">
                      {feedback.is_issue_actually_fixed ? 'Verified Fixed' : 'Issue Still Persists'}
                    </span>
                  </div>
                  {feedback.comment && (
                    <p className="text-xs text-gray-700 italic">"{feedback.comment}"</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-gray-700">{rating} of 5 Stars</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsActuallyFixed(true)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-black transition-all ${
                        isActuallyFixed ? 'bg-green-400 text-black' : 'bg-white text-gray-600'
                      }`}
                    >
                      ✓ Yes, fixed completely
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsActuallyFixed(false)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-black transition-all ${
                        !isActuallyFixed ? 'bg-red-400 text-black' : 'bg-white text-gray-600'
                      }`}
                    >
                      ✕ No, still broken (Auto-Reopen)
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Optional feedback comment on the repair..."
                      className="flex-1 text-xs border-2 border-black rounded-xl px-3 py-2 bg-white"
                    />
                    <button
                      type="submit"
                      className="bg-black hover:bg-[#C8E64D] hover:text-black text-white text-xs font-bold px-4 py-2 rounded-xl border-2 border-black transition-colors"
                    >
                      Submit Verification
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Activity Audit Trail */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Activity & Audit Trail ({logs.length})</span>
            </h4>
            <div className="border-2 border-black rounded-2xl p-4 bg-[#F7F6F2] space-y-3 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-xs border-b border-black/10 pb-2 last:border-b-0">
                  <div className="w-2 h-2 rounded-full bg-black mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{log.action}</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[11px] mt-0.5">{log.details}</p>
                    <span className="text-[10px] text-gray-500 font-medium">Actor: {log.actor}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
