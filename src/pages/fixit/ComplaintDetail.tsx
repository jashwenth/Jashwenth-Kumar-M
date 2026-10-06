import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Wrench,
  Shield,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { fixitApi } from '../../services/fixitApi';
import StatusBadge from '../../components/fixit/StatusBadge';
import PriorityBadge from '../../components/fixit/PriorityBadge';
import CategoryBadge from '../../components/fixit/CategoryBadge';
import StatusStepper from '../../components/fixit/StatusStepper';
import ActivityTimeline from '../../components/fixit/ActivityTimeline';
import ConfirmationModal from '../../components/fixit/ConfirmationModal';
import type {
  ComplaintWithDetails,
  ComplaintPriority,
  ComplaintStatus,
  User as FixitUser,
} from '../../../backend/types/fixit';

interface ComplaintDetailProps {
  complaintId: string;
  onBack: () => void;
}

export default function ComplaintDetail({ complaintId, onBack }: ComplaintDetailProps) {
  const [complaint, setComplaint] = useState<ComplaintWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<FixitUser | null>(() => fixitApi.getCurrentUser());

  // Maintenance action states
  const [staffList, setStaffList] = useState<FixitUser[]>([]);
  const [newRemark, setNewRemark] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fixitApi.getComplaint(complaintId);
      setComplaint(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = fixitApi.subscribe(() => {
      setCurrentUser(fixitApi.getCurrentUser());
    });
    return unsub;
  }, [complaintId]);

  useEffect(() => {
    // If maintenance or admin, load staff list for assignment
    if (currentUser?.role === 'MAINTENANCE' || currentUser?.role === 'ADMIN') {
      fixitApi.getMaintenanceStaff().then(setStaffList).catch(() => {});
    }
  }, [currentUser]);

  const canManage = currentUser?.role === 'MAINTENANCE' || currentUser?.role === 'ADMIN';

  // Action: Update Status with confirmation for RESOLVED
  const handleStatusChange = (newStatus: ComplaintStatus) => {
    if (!complaint) return;
    setActionMessage(null);

    if (newStatus === 'RESOLVED') {
      setConfirmModal({
        isOpen: true,
        title: 'Mark Complaint as Resolved',
        message: `Are you sure you want to mark ${complaint.complaintId} as completely resolved? This will record the official resolution timestamp and notify the reporting student/staff.`,
        isDestructive: false,
        onConfirm: async () => {
          setActionLoading(true);
          try {
            const updated = await fixitApi.updateStatus(complaint.complaintId, 'RESOLVED');
            setComplaint(updated);
            setActionMessage({ type: 'success', text: 'Complaint marked as RESOLVED.' });
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } catch (e: any) {
            setActionMessage({ type: 'error', text: e?.message || 'Failed to update status' });
          } finally {
            setActionLoading(false);
          }
        },
      });
      return;
    }

    // Direct update for IN_PROGRESS or PENDING
    setActionLoading(true);
    fixitApi
      .updateStatus(complaint.complaintId, newStatus)
      .then((updated) => {
        setComplaint(updated);
        setActionMessage({ type: 'success', text: `Status changed to ${newStatus}.` });
      })
      .catch((e) => {
        setActionMessage({ type: 'error', text: e?.message || 'Failed to update status' });
      })
      .finally(() => setActionLoading(false));
  };

  // Action: Update Priority with confirmation for CRITICAL
  const handlePriorityChange = (newPriority: ComplaintPriority) => {
    if (!complaint) return;
    setActionMessage(null);

    if (newPriority === 'CRITICAL') {
      setConfirmModal({
        isOpen: true,
        title: 'Escalate to CRITICAL Priority',
        message: `Setting ${complaint.complaintId} to CRITICAL will trigger high-urgency notifications and priority dispatch. Confirm this escalation?`,
        isDestructive: true,
        onConfirm: async () => {
          setActionLoading(true);
          try {
            const updated = await fixitApi.updatePriority(complaint.complaintId, 'CRITICAL');
            setComplaint(updated);
            setActionMessage({ type: 'success', text: 'Priority escalated to CRITICAL.' });
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } catch (e: any) {
            setActionMessage({ type: 'error', text: e?.message || 'Failed to update priority' });
          } finally {
            setActionLoading(false);
          }
        },
      });
      return;
    }

    setActionLoading(true);
    fixitApi
      .updatePriority(complaint.complaintId, newPriority)
      .then((updated) => {
        setComplaint(updated);
        setActionMessage({ type: 'success', text: `Priority changed to ${newPriority}.` });
      })
      .catch((e) => {
        setActionMessage({ type: 'error', text: e?.message || 'Failed to update priority' });
      })
      .finally(() => setActionLoading(false));
  };

  // Action: Assign Staff
  const handleAssignStaff = (staffId: string) => {
    if (!complaint || !staffId) return;
    setActionMessage(null);

    const staffMember = staffList.find((s) => s.id === staffId);
    setConfirmModal({
      isOpen: true,
      title: 'Assign Maintenance Personnel',
      message: `Assign work order ${complaint.complaintId} to ${staffMember?.name || 'Staff'} (${staffMember?.department || 'Facilities'})?`,
      isDestructive: false,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const updated = await fixitApi.assignComplaint(complaint.complaintId, staffId);
          setComplaint(updated);
          setActionMessage({ type: 'success', text: `Assigned to ${staffMember?.name || 'staff member'}.` });
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (e: any) {
          setActionMessage({ type: 'error', text: e?.message || 'Failed to assign staff' });
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Action: Add Remark
  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint || !newRemark.trim() || savingRemark) return;
    setActionMessage(null);

    setSavingRemark(true);
    try {
      const updated = await fixitApi.addRemark(complaint.complaintId, newRemark.trim());
      setComplaint(updated);
      setNewRemark('');
      setActionMessage({ type: 'success', text: 'Remark saved and recorded to timeline.' });
    } catch (e: any) {
      setActionMessage({ type: 'error', text: e?.message || 'Failed to save remark' });
    } finally {
      setSavingRemark(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded-xl w-32" />
        <div className="h-44 bg-white border-4 border-black rounded-3xl p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto bg-white border-4 border-black rounded-3xl p-8 brutal-shadow text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />
        <h2 className="text-2xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
          Unable to Load Complaint
        </h2>
        <p className="text-sm text-gray-600 font-medium">
          {error || 'The requested complaint does not exist or you do not have permission to view it.'}
        </p>
        <button
          onClick={onBack}
          className="bg-black text-white hover:bg-[#C8E64D] hover:text-black font-bold px-6 py-2.5 rounded-xl border-2 border-black transition-colors"
        >
          Return to Complaints
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Complaints</span>
        </button>

        <span className="text-xs font-mono font-bold text-gray-500">
          Complaint Record: {complaint.complaintId}
        </span>
      </div>

      {/* Main Detail Header Card */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border-2 border-black flex items-center justify-between text-xs font-bold brutal-shadow animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-[#C8E64D] text-black'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs uppercase underline cursor-pointer hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-black pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-sm font-bold bg-black text-[#C8E64D] px-3 py-1 rounded-md">
                {complaint.complaintId}
              </span>
              <CategoryBadge category={complaint.category} />
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-black mt-2 leading-tight" style={{ fontFamily: 'Lexend' }}>
              {complaint.description}
            </h1>
          </div>

          <div className="text-left sm:text-right text-xs text-gray-500 space-y-1 flex-shrink-0">
            <div>
              Reported:{' '}
              <strong className="text-black">
                {new Date(complaint.createdAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
            <div>
              Updated:{' '}
              <strong className="text-black">
                {new Date(complaint.updatedAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
          </div>
        </div>

        {/* Status Stepper */}
        <StatusStepper
          status={complaint.status}
          createdAt={complaint.createdAt}
          updatedAt={complaint.updatedAt}
          resolvedAt={complaint.resolvedAt}
        />

        {/* Location & Reporter Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#F7F6F2] border-2 border-black/15 text-xs">
          {/* Location */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Exact Location</span>
            <div className="flex items-center gap-1.5 font-bold text-sm text-black">
              <MapPin className="w-4 h-4 text-black flex-shrink-0" />
              <span>
                {complaint.building}, Floor {complaint.floor}, Room {complaint.roomNumber}
              </span>
            </div>
            <span className="text-[11px] text-gray-600 block">Main Campus Facility</span>
          </div>

          {/* Reporter */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Reported By</span>
            <div className="flex items-center gap-1.5 font-bold text-sm text-black">
              <User className="w-4 h-4 text-black flex-shrink-0" />
              <span>{complaint.reporter?.name || 'Alex Chen'}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-black text-[#C8E64D] uppercase">
                {complaint.reporter?.role || 'STUDENT'}
              </span>
            </div>
            <span className="text-[11px] text-gray-600 block">
              {complaint.reporter?.department || 'Computer Science'} • {complaint.reporter?.email || 'alex@wales.edu'}
            </span>
          </div>

          {/* Assigned Staff */}
          <div className="space-y-1 sm:col-span-2 pt-2 border-t border-black/10">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Assigned Technician</span>
            {complaint.assignedStaff ? (
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <Wrench className="w-4 h-4 text-emerald-700" />
                <span>{complaint.assignedStaff.name}</span>
                <span className="text-xs font-medium text-gray-600">
                  ({complaint.assignedStaff.department})
                </span>
              </div>
            ) : (
              <div className="text-xs text-amber-700 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Not assigned yet • Awaiting dispatcher</span>
              </div>
            )}
          </div>
        </div>

        {/* Photo evidence if present */}
        {complaint.photoUrl && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black">
              Uploaded Photo Attachment
            </h3>
            <div className="border-3 border-black rounded-2xl overflow-hidden bg-black/5 max-h-80 w-full sm:max-w-md">
              <img
                src={complaint.photoUrl}
                alt={`Photo for ${complaint.complaintId}`}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Official Remark if present */}
        {complaint.remarks && (
          <div className="p-4 bg-purple-50 border-2 border-purple-400 rounded-2xl space-y-1">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
              <MessageSquare className="w-4 h-4" />
              <span>Maintenance Team Remarks</span>
            </div>
            <p className="text-xs text-purple-950 font-medium leading-relaxed">
              "{complaint.remarks}"
            </p>
          </div>
        )}
      </div>

      {/* ADMIN & MAINTENANCE CONTROL PANEL (Role Gated Server-Side) */}
      {canManage && (
        <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-6">
          <div className="border-b-2 border-black pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-black" />
              <h2 className="text-xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
                Maintenance Operations Controls
              </h2>
            </div>
            <span className="text-[10px] font-bold uppercase bg-black text-[#C8E64D] px-2.5 py-1 rounded-full">
              Role: {currentUser?.role}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status Control */}
            <div>
              <label htmlFor="change-status" className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
                Update Status
              </label>
              <select
                id="change-status"
                value={complaint.status}
                disabled={actionLoading}
                onChange={(e) => handleStatusChange(e.target.value as ComplaintStatus)}
                className="w-full border-2 border-black rounded-xl p-2.5 bg-[#F7F6F2] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            {/* Priority Control */}
            <div>
              <label htmlFor="change-priority" className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
                Change Priority
              </label>
              <select
                id="change-priority"
                value={complaint.priority}
                disabled={actionLoading}
                onChange={(e) => handlePriorityChange(e.target.value as ComplaintPriority)}
                className="w-full border-2 border-black rounded-xl p-2.5 bg-[#F7F6F2] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            {/* Assign Staff Control */}
            <div>
              <label htmlFor="assign-staff-select" className="text-xs font-bold uppercase tracking-wider text-black block mb-2">
                Assign Technician
              </label>
              <select
                id="assign-staff-select"
                value={complaint.assignedStaffId || ''}
                disabled={actionLoading}
                onChange={(e) => handleAssignStaff(e.target.value)}
                className="w-full border-2 border-black rounded-xl p-2.5 bg-[#F7F6F2] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C8E64D]"
              >
                <option value="">Unassigned</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Add Remark Form */}
          <form onSubmit={handleAddRemark} className="pt-4 border-t-2 border-black/10 space-y-3">
            <label htmlFor="add-remark-input" className="text-xs font-bold uppercase tracking-wider text-black block">
              Add Field Note / Remark
            </label>
            <div className="flex gap-2">
              <input
                id="add-remark-input"
                type="text"
                value={newRemark}
                onChange={(e) => setNewRemark(e.target.value)}
                placeholder="e.g. Electrical team inspected socket. Replacement box ordered."
                className="flex-1 border-2 border-black rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#C8E64D] bg-[#F7F6F2]"
              />
              <button
                type="submit"
                disabled={!newRemark.trim() || savingRemark}
                className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-black flex items-center gap-1.5 transition-colors brutal-shadow disabled:opacity-40"
              >
                {savingRemark ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Add Remark</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activity Timeline Card */}
      <div className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-4">
        <div className="border-b-2 border-black pb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-black" style={{ fontFamily: 'Lexend' }}>
            Activity & Audit Trail ({complaint.activities?.length || 0})
          </h2>
          <span className="text-[10px] font-mono text-gray-500">Real-time audit log</span>
        </div>

        <ActivityTimeline activities={complaint.activities} />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDestructive={confirmModal.isDestructive}
        loading={actionLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
