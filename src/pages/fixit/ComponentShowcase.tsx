import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Send,
  X,
  Filter,
} from 'lucide-react';
import StatusBadge from '../../components/fixit/StatusBadge';
import PriorityBadge from '../../components/fixit/PriorityBadge';
import CategoryBadge from '../../components/fixit/CategoryBadge';
import StatusStepper from '../../components/fixit/StatusStepper';
import ActivityTimeline from '../../components/fixit/ActivityTimeline';
import ConfirmationModal from '../../components/fixit/ConfirmationModal';
import PhotoUploader from '../../components/fixit/PhotoUploader';
import ComplaintCard from '../../components/fixit/ComplaintCard';
import type { ComplaintWithDetails } from '../../../backend/types/fixit';

export default function ComponentShowcase() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [modalConfirmed, setModalConfirmed] = useState(false);
  const [samplePhoto, setSamplePhoto] = useState<string | null>(null);

  const sampleComplaint: ComplaintWithDetails = {
    id: 'c_demo_showcase',
    complaintId: 'FX-1024',
    reporterId: 'usr_student_1',
    category: 'WATER_LEAKAGE',
    description: 'Water pipe leak near radiator heating valve causing puddle on Floor 2 washroom.',
    building: 'Block A',
    floor: '2',
    roomNumber: '204',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    photoUrl: null,
    assignedStaffId: 'usr_maint_1',
    remarks: 'Plumbing team inspected valve. Gasket replacement in progress.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    resolvedAt: null,
    reporter: {
      id: 'usr_student_1',
      name: 'Alex Chen',
      email: 'alex@wales.edu',
      role: 'STUDENT',
      department: 'Computer Science',
    },
    assignedStaff: {
      id: 'usr_maint_1',
      name: 'Dave Miller',
      email: 'dave.maintenance@wales.edu',
      role: 'MAINTENANCE',
      department: 'Plumbing & Mechanical',
    },
    activities: [
      {
        id: 'act_demo_1',
        complaintId: 'c_demo_showcase',
        userId: 'usr_student_1',
        action: 'COMPLAINT_SUBMITTED',
        oldValue: null,
        newValue: null,
        details: 'Complaint submitted by Alex Chen',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        user: { name: 'Alex Chen', role: 'STUDENT' },
      },
      {
        id: 'act_demo_2',
        complaintId: 'c_demo_showcase',
        userId: 'usr_admin_1',
        action: 'ASSIGNED',
        oldValue: 'Unassigned',
        newValue: 'Dave Miller',
        details: 'Assigned to Dave Miller (Plumbing & Mechanical)',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        user: { name: 'Eleanor Wright', role: 'ADMIN' },
      },
      {
        id: 'act_demo_3',
        complaintId: 'c_demo_showcase',
        userId: 'usr_maint_1',
        action: 'STATUS_CHANGED',
        oldValue: 'PENDING',
        newValue: 'IN_PROGRESS',
        details: 'Field diagnostic initiated on Floor 2',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        user: { name: 'Dave Miller', role: 'MAINTENANCE' },
      },
    ],
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
          Fixit Design System • Complete State Matrix
        </span>
        <h1 className="text-3xl font-bold text-black" style={{ fontFamily: 'Lexend' }}>
          Component Showcase (/fixit/components)
        </h1>
        <p className="text-xs text-gray-600 mt-1">
          Interactive catalog of all accessible buttons, input states, badges, steppers, and modals built for Fixit.
        </p>
      </div>

      {/* 1. BUTTON STATES */}
      <section className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-4">
        <h2 className="text-xl font-bold text-black border-b-2 border-black pb-3" style={{ fontFamily: 'Lexend' }}>
          1. Button Variants & Interactive States
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          {/* Default */}
          <button className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-black brutal-shadow transition-all">
            Default Button
          </button>

          {/* Hover preview */}
          <button className="bg-[#C8E64D] text-black px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-black shadow-[4px_4px_0px_#000] scale-105 transition-all">
            Hover State
          </button>

          {/* Focus */}
          <button className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-black ring-4 ring-[#C8E64D]">
            Focused State
          </button>

          {/* Loading */}
          <button disabled className="bg-black text-white px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-black flex items-center gap-1.5 opacity-80 cursor-wait">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Loading...</span>
          </button>

          {/* Disabled */}
          <button disabled className="bg-gray-200 text-gray-400 px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-gray-300 cursor-not-allowed">
            Disabled State
          </button>

          {/* Destructive */}
          <button className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-black brutal-shadow flex items-center gap-1.5 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Destructive Action</span>
          </button>
        </div>
      </section>

      {/* 2. INPUT & SELECT STATES */}
      <section className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-4">
        <h2 className="text-xl font-bold text-black border-b-2 border-black pb-3" style={{ fontFamily: 'Lexend' }}>
          2. Form Inputs & Select Controls
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Default */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-black">Default Input</label>
            <input
              type="text"
              defaultValue="Standard input field"
              className="w-full border-2 border-black rounded-xl p-3 text-xs bg-[#F7F6F2]"
            />
          </div>

          {/* Error */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-red-600">Error State</label>
            <input
              type="text"
              defaultValue="Invalid value provided"
              className="w-full border-2 border-red-500 rounded-xl p-3 text-xs bg-red-50 text-red-900"
            />
            <span className="text-[10px] text-red-600 font-bold">Field is required</span>
          </div>

          {/* Disabled */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-gray-400">Disabled Input</label>
            <input
              type="text"
              disabled
              defaultValue="Read-only system input"
              className="w-full border-2 border-gray-300 rounded-xl p-3 text-xs bg-gray-100 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>
      </section>

      {/* 3. STATUS & PRIORITY BADGES */}
      <section className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-6">
        <h2 className="text-xl font-bold text-black border-b-2 border-black pb-3" style={{ fontFamily: 'Lexend' }}>
          3. Status & Priority Badges (Accessible: Icon + Color + Text)
        </h2>

        <div>
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Status Badges</h3>
          <div className="flex flex-wrap gap-3">
            <StatusBadge status="PENDING" size="lg" />
            <StatusBadge status="IN_PROGRESS" size="lg" />
            <StatusBadge status="RESOLVED" size="lg" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Priority Badges</h3>
          <div className="flex flex-wrap gap-3">
            <PriorityBadge priority="LOW" size="lg" />
            <PriorityBadge priority="MEDIUM" size="lg" />
            <PriorityBadge priority="HIGH" size="lg" />
            <PriorityBadge priority="CRITICAL" size="lg" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Category Badges</h3>
          <div className="flex flex-wrap gap-3">
            <CategoryBadge category="WATER_LEAKAGE" />
            <CategoryBadge category="ELECTRICAL" />
            <CategoryBadge category="FURNITURE" />
            <CategoryBadge category="CLASSROOM_MAINTENANCE" />
            <CategoryBadge category="OTHER" />
          </div>
        </div>
      </section>

      {/* 4. STATUS STEPPER */}
      <section className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-4">
        <h2 className="text-xl font-bold text-black border-b-2 border-black pb-3" style={{ fontFamily: 'Lexend' }}>
          4. Status Stepper (Live Real-Time Stepper)
        </h2>
        <StatusStepper
          status="IN_PROGRESS"
          createdAt={new Date(Date.now() - 86400000 * 2).toISOString()}
          updatedAt={new Date(Date.now() - 3600000 * 5).toISOString()}
        />
      </section>

      {/* 5. COMPLAINT CARD & TIMELINE */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
          <h2 className="text-xl font-bold text-black border-b-2 border-black pb-3" style={{ fontFamily: 'Lexend' }}>
            5. Responsive Complaint Card
          </h2>
          <ComplaintCard complaint={sampleComplaint} onClick={() => {}} />
        </div>

        <div className="bg-white border-4 border-black rounded-3xl p-6 brutal-shadow space-y-4">
          <h2 className="text-xl font-bold text-black border-b-2 border-black pb-3" style={{ fontFamily: 'Lexend' }}>
            6. Activity Audit Trail
          </h2>
          <ActivityTimeline activities={sampleComplaint.activities} />
        </div>
      </section>

      {/* 7. CONFIRMATION MODAL & PHOTO UPLOADER */}
      <section className="bg-white border-4 border-black rounded-3xl p-6 sm:p-8 brutal-shadow space-y-4">
        <h2 className="text-xl font-bold text-black border-b-2 border-black pb-3" style={{ fontFamily: 'Lexend' }}>
          7. Interactive Dialogs & Uploading
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <button
            onClick={() => {
              setModalConfirmed(false);
              setShowConfirm(true);
            }}
            className="bg-black hover:bg-[#C8E64D] hover:text-black text-white px-6 py-3 rounded-xl text-xs font-bold border-2 border-black brutal-shadow transition-all"
          >
            Launch Confirmation Modal
          </button>
          {modalConfirmed && (
            <span className="text-xs font-bold text-emerald-800 bg-[#C8E64D] border-2 border-black px-3 py-1.5 rounded-xl">
              ✓ Modal Action Confirmed!
            </span>
          )}
        </div>

        <div className="pt-4 border-t-2 border-black/10">
          <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Photo Uploader Dropzone</h3>
          <PhotoUploader value={samplePhoto} onChange={setSamplePhoto} />
        </div>
      </section>

      {/* Modal instance */}
      <ConfirmationModal
        isOpen={showConfirm}
        title="Sample Action Confirmation"
        message="This is a live test of the accessible confirmation modal. Are you sure you want to perform this operation?"
        onConfirm={() => {
          setModalConfirmed(true);
          setShowConfirm(false);
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
