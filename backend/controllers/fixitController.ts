import type { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import type {
  Complaint,
  ComplaintActivity,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  ComplaintWithDetails,
} from '../types/fixit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const VALID_CATEGORIES: ComplaintCategory[] = [
  'FURNITURE',
  'ELECTRICAL',
  'WATER_LEAKAGE',
  'CLASSROOM_MAINTENANCE',
  'OTHER',
];

const VALID_PRIORITIES: ComplaintPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_STATUSES: ComplaintStatus[] = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

// Helper to enrich a complaint with reporter and assigned staff info
function enrichComplaint(complaint: Complaint): ComplaintWithDetails {
  const reporter = db.getUserById(complaint.reporterId);
  const assignedStaff = complaint.assignedStaffId ? db.getUserById(complaint.assignedStaffId) : null;
  const rawActivities = db.getActivitiesForComplaint(complaint.id);

  const activities = rawActivities.map((act) => {
    const actUser = db.getUserById(act.userId);
    return {
      ...act,
      user: actUser ? { name: actUser.name, role: actUser.role } : undefined,
    };
  });

  return {
    ...complaint,
    reporter: reporter
      ? {
          id: reporter.id,
          name: reporter.name,
          email: reporter.email,
          role: reporter.role,
          department: reporter.department,
        }
      : undefined,
    assignedStaff: assignedStaff
      ? {
          id: assignedStaff.id,
          name: assignedStaff.name,
          email: assignedStaff.email,
          role: assignedStaff.role,
          department: assignedStaff.department,
        }
      : null,
    activities,
  };
}

// 1. Submit Complaint
export const submitComplaint = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const { category, description, building, floor, roomNumber, priority, photoUrl } = req.body;

  // Validation
  if (!category || !VALID_CATEGORIES.includes(category)) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'category',
        message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
      },
    });
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'description',
        message: 'Description must be at least 10 characters long.',
      },
    });
  }

  if (description.trim().length > 1000) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'description',
        message: 'Description cannot exceed 1000 characters.',
      },
    });
  }

  if (!building || typeof building !== 'string' || !building.trim()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'building',
        message: 'Building is required.',
      },
    });
  }

  if (!floor || typeof floor !== 'string' || !floor.trim()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'floor',
        message: 'Floor is required.',
      },
    });
  }

  if (!roomNumber || typeof roomNumber !== 'string' || !roomNumber.trim()) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'roomNumber',
        message: 'Room number is required.',
      },
    });
  }

  const validPriority: ComplaintPriority = VALID_PRIORITIES.includes(priority)
    ? priority
    : 'MEDIUM';

  const newId = `c_${Date.now()}`;
  const complaintCode = db.getNextComplaintId();
  const nowIso = new Date().toISOString();

  const newComplaint: Complaint = {
    id: newId,
    complaintId: complaintCode,
    reporterId: req.user.id, // Always use authenticated user's ID
    category,
    description: description.trim(),
    building: building.trim(),
    floor: floor.trim(),
    roomNumber: roomNumber.trim(),
    priority: validPriority,
    status: 'PENDING',
    photoUrl: photoUrl || null,
    assignedStaffId: null,
    remarks: null,
    createdAt: nowIso,
    updatedAt: nowIso,
    resolvedAt: null,
  };

  db.createComplaint(newComplaint);

  // Create initial activity: COMPLAINT_SUBMITTED
  db.createActivity({
    id: `act_${Date.now()}_1`,
    complaintId: newId,
    userId: req.user.id,
    action: 'COMPLAINT_SUBMITTED',
    oldValue: null,
    newValue: null,
    details: `Complaint submitted by ${req.user.name} (${req.user.role})`,
    createdAt: nowIso,
  });

  // Create initial notification for reporter
  db.createNotification({
    id: `notif_${Date.now()}`,
    userId: req.user.id,
    complaintId: newId,
    title: `Complaint Submitted: ${complaintCode}`,
    message: `Your maintenance complaint ${complaintCode} at ${building}, Floor ${floor}, Room ${roomNumber} has been received.`,
    read: false,
    createdAt: nowIso,
  });

  const enriched = enrichComplaint(newComplaint);

  return res.status(201).json({
    success: true,
    complaint: enriched,
  });
};

// 2. Upload Photo
export const uploadPhoto = (req: AuthenticatedRequest, res: Response) => {
  // Support multipart upload via multer (req.file)
  if (req.file) {
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      url: fileUrl,
    });
  }

  // Support JSON base64 upload
  const { data, mimeType, filename } = req.body;
  if (!data) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'No file uploaded or data provided.' },
    });
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const mime = mimeType || 'image/jpeg';
  if (!allowedMimes.includes(mime)) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Only JPG, PNG, and WebP images are supported.',
      },
    });
  }

  const base64Data = data.includes(',') ? data.split(',')[1] : data;
  const buffer = Buffer.from(base64Data, 'base64');

  // Max 5MB
  if (buffer.length > 5 * 1024 * 1024) {
    return res.status(413).json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'File size cannot exceed 5MB.' },
    });
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const safeName = `fx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeName);

  fs.writeFileSync(filePath, buffer);

  return res.status(200).json({
    success: true,
    url: `/uploads/${safeName}`,
  });
};

// 3. Get Complaints
export const getComplaints = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const { search, category, status, priority, dateFrom, dateTo, sort, page, limit } = req.query;

  let complaints = db.getComplaints();

  // Role-based authorization: Students and Staff only see their own complaints
  if (req.user.role === 'STUDENT' || req.user.role === 'STAFF') {
    complaints = complaints.filter((c) => c.reporterId === req.user!.id);
  }

  // Filter: search
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    complaints = complaints.filter(
      (c) =>
        c.complaintId.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.building.toLowerCase().includes(q) ||
        c.roomNumber.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  // Filter: category
  if (category && typeof category === 'string' && category !== 'ALL') {
    complaints = complaints.filter((c) => c.category === category);
  }

  // Filter: status
  if (status && typeof status === 'string' && status !== 'ALL') {
    complaints = complaints.filter((c) => c.status === status);
  }

  // Filter: priority
  if (priority && typeof priority === 'string' && priority !== 'ALL') {
    complaints = complaints.filter((c) => c.priority === priority);
  }

  // Filter: dateFrom / dateTo
  if (dateFrom && typeof dateFrom === 'string') {
    const fromTime = new Date(dateFrom).getTime();
    if (!isNaN(fromTime)) {
      complaints = complaints.filter((c) => new Date(c.createdAt).getTime() >= fromTime);
    }
  }
  if (dateTo && typeof dateTo === 'string') {
    const toTime = new Date(dateTo).getTime();
    if (!isNaN(toTime)) {
      complaints = complaints.filter((c) => new Date(c.createdAt).getTime() <= toTime);
    }
  }

  // Sort
  const priorityOrder: Record<ComplaintPriority, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  if (sort === 'oldest') {
    complaints.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'highestPriority') {
    complaints.sort((a, b) => {
      const pDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else {
    // Default newest
    complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(String(page || 1), 10));
  const limitNum = Math.max(1, Math.min(100, parseInt(String(limit || 20), 10)));
  const total = complaints.length;
  const totalPages = Math.ceil(total / limitNum) || 1;

  const paginated = complaints.slice((pageNum - 1) * limitNum, pageNum * limitNum);
  const enriched = paginated.map(enrichComplaint);

  return res.status(200).json({
    success: true,
    complaints: enriched,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages,
  });
};

// 4. Get Single Complaint
export const getSingleComplaint = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const { complaintId } = req.params;
  const complaint = db.getComplaintById(complaintId);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Complaint ${complaintId} not found.` },
    });
  }

  // Authorization check: students/staff can only view complaints they submitted
  if (
    (req.user.role === 'STUDENT' || req.user.role === 'STAFF') &&
    complaint.reporterId !== req.user.id
  ) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You are not authorized to view this complaint.',
      },
    });
  }

  const enriched = enrichComplaint(complaint);
  return res.status(200).json({
    success: true,
    complaint: enriched,
  });
};

// 5. Update Status
export const updateStatus = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  if (req.user.role !== 'MAINTENANCE' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only maintenance staff and administrators can update complaint status.',
      },
    });
  }

  const { complaintId } = req.params;
  const { status, remarks } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'status',
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      },
    });
  }

  const complaint = db.getComplaintById(complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Complaint ${complaintId} not found.` },
    });
  }

  const oldStatus = complaint.status;
  const nowIso = new Date().toISOString();
  const isResolved = status === 'RESOLVED';

  const updates: Partial<Complaint> = {
    status,
    resolvedAt: isResolved ? nowIso : status === 'PENDING' ? null : complaint.resolvedAt,
  };
  if (remarks && typeof remarks === 'string') {
    updates.remarks = remarks.trim();
  }

  const updated = db.updateComplaint(complaint.id, updates);
  if (!updated) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update complaint.' },
    });
  }

  // Create Activity
  db.createActivity({
    id: `act_${Date.now()}`,
    complaintId: complaint.id,
    userId: req.user.id,
    action: isResolved ? 'RESOLVED' : 'STATUS_CHANGED',
    oldValue: oldStatus,
    newValue: status,
    details: remarks
      ? `Status changed from ${oldStatus} to ${status}. Remark: "${remarks.trim()}"`
      : `Status changed from ${oldStatus} to ${status} by ${req.user.name}`,
    createdAt: nowIso,
  });

  // Notify reporter
  db.createNotification({
    id: `notif_${Date.now()}`,
    userId: complaint.reporterId,
    complaintId: complaint.id,
    title: `Complaint ${complaint.complaintId}: ${status}`,
    message: isResolved
      ? `Your maintenance complaint ${complaint.complaintId} has been resolved by ${req.user.name}.`
      : `Complaint ${complaint.complaintId} status changed to ${status}.`,
    read: false,
    createdAt: nowIso,
  });

  const enriched = enrichComplaint(updated);
  return res.status(200).json({
    success: true,
    complaint: enriched,
  });
};

// 6. Update Priority
export const updatePriority = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  if (req.user.role !== 'MAINTENANCE' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only maintenance staff and administrators can change priority.',
      },
    });
  }

  const { complaintId } = req.params;
  const { priority } = req.body;

  if (!priority || !VALID_PRIORITIES.includes(priority)) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'priority',
        message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
      },
    });
  }

  const complaint = db.getComplaintById(complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Complaint ${complaintId} not found.` },
    });
  }

  const oldPriority = complaint.priority;
  const nowIso = new Date().toISOString();

  const updated = db.updateComplaint(complaint.id, { priority });
  if (!updated) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update priority.' },
    });
  }

  // Create Activity
  db.createActivity({
    id: `act_${Date.now()}`,
    complaintId: complaint.id,
    userId: req.user.id,
    action: 'PRIORITY_CHANGED',
    oldValue: oldPriority,
    newValue: priority,
    details: `Priority changed from ${oldPriority} to ${priority} by ${req.user.name}`,
    createdAt: nowIso,
  });

  const enriched = enrichComplaint(updated);
  return res.status(200).json({
    success: true,
    complaint: enriched,
  });
};

// 7. Assign Maintenance Staff
export const assignStaff = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  if (req.user.role !== 'MAINTENANCE' && req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only maintenance staff and administrators can assign personnel.',
      },
    });
  }

  const { complaintId } = req.params;
  const assignedStaffId = req.body.assignedStaffId || req.body.staffId;

  if (!assignedStaffId || typeof assignedStaffId !== 'string') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'assignedStaffId',
        message: 'Assigned staff ID is required.',
      },
    });
  }

  const complaint = db.getComplaintById(complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Complaint ${complaintId} not found.` },
    });
  }

  const targetStaff = db.getUserById(assignedStaffId);
  if (!targetStaff) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'Assigned staff user does not exist.' },
    });
  }

  if (targetStaff.role !== 'MAINTENANCE' && targetStaff.role !== 'ADMIN') {
    return res.status(422).json({
      success: false,
      error: {
        code: 'INVALID_ROLE',
        message: 'Target user must have MAINTENANCE or ADMIN role.',
      },
    });
  }

  const oldStaff = complaint.assignedStaffId ? db.getUserById(complaint.assignedStaffId) : null;
  const nowIso = new Date().toISOString();

  const updated = db.updateComplaint(complaint.id, {
    assignedStaffId,
    // Automatically advance to IN_PROGRESS if currently PENDING
    status: complaint.status === 'PENDING' ? 'IN_PROGRESS' : complaint.status,
  });

  if (!updated) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to assign staff.' },
    });
  }

  // Create Activity
  db.createActivity({
    id: `act_${Date.now()}`,
    complaintId: complaint.id,
    userId: req.user.id,
    action: 'ASSIGNED',
    oldValue: oldStaff?.name || 'Unassigned',
    newValue: targetStaff.name,
    details: `Assigned to ${targetStaff.name} (${targetStaff.department}) by ${req.user.name}`,
    createdAt: nowIso,
  });

  // Notify assigned staff
  db.createNotification({
    id: `notif_${Date.now()}_staff`,
    userId: targetStaff.id,
    complaintId: complaint.id,
    title: `Work Order Assigned: ${complaint.complaintId}`,
    message: `You have been assigned to maintenance complaint ${complaint.complaintId} in ${complaint.building}.`,
    read: false,
    createdAt: nowIso,
  });

  // Notify reporter
  db.createNotification({
    id: `notif_${Date.now()}_reporter`,
    userId: complaint.reporterId,
    complaintId: complaint.id,
    title: `Complaint ${complaint.complaintId} Assigned`,
    message: `Your complaint has been assigned to ${targetStaff.name} (${targetStaff.department}).`,
    read: false,
    createdAt: nowIso,
  });

  const enriched = enrichComplaint(updated);
  return res.status(200).json({
    success: true,
    complaint: enriched,
  });
};

// 8. Add Remark
export const addRemark = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const { complaintId } = req.params;
  const remark = req.body.remark || req.body.remarks;

  if (!remark || typeof remark !== 'string' || remark.trim().length < 3) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'remark',
        message: 'Remark must be at least 3 characters long.',
      },
    });
  }

  if (remark.trim().length > 500) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        field: 'remark',
        message: 'Remark cannot exceed 500 characters.',
      },
    });
  }

  const complaint = db.getComplaintById(complaintId);
  if (!complaint) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Complaint ${complaintId} not found.` },
    });
  }

  const nowIso = new Date().toISOString();
  const sanitizedRemark = remark.trim();

  const updated = db.updateComplaint(complaint.id, {
    remarks: sanitizedRemark,
  });

  if (!updated) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to add remark.' },
    });
  }

  // Create Activity
  db.createActivity({
    id: `act_${Date.now()}`,
    complaintId: complaint.id,
    userId: req.user.id,
    action: 'REMARK_ADDED',
    oldValue: null,
    newValue: null,
    details: `${req.user.name}: "${sanitizedRemark}"`,
    createdAt: nowIso,
  });

  // Notify reporter if remark author is maintenance/admin
  if (req.user.id !== complaint.reporterId) {
    db.createNotification({
      id: `notif_${Date.now()}`,
      userId: complaint.reporterId,
      complaintId: complaint.id,
      title: `New Note on ${complaint.complaintId}`,
      message: `${req.user.name} added a remark: "${sanitizedRemark}"`,
      read: false,
      createdAt: nowIso,
    });
  }

  const enriched = enrichComplaint(updated);
  return res.status(200).json({
    success: true,
    complaint: enriched,
  });
};

// 9. Statistics API
export const getStatistics = (req: AuthenticatedRequest, res: Response) => {
  const { range, dateFrom, dateTo } = req.query;

  let complaints = db.getComplaints();

  // Date range filtering
  const now = new Date();
  let startTime = 0;

  if (range === 'today') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    startTime = today.getTime();
  } else if (range === '7d') {
    startTime = now.getTime() - 7 * 86400000;
  } else if (range === '30d') {
    startTime = now.getTime() - 30 * 86400000;
  } else if (dateFrom && typeof dateFrom === 'string') {
    startTime = new Date(dateFrom).getTime();
  }

  if (startTime > 0) {
    complaints = complaints.filter((c) => new Date(c.createdAt).getTime() >= startTime);
  }

  if (dateTo && typeof dateTo === 'string') {
    const endTime = new Date(dateTo).getTime();
    if (!isNaN(endTime)) {
      complaints = complaints.filter((c) => new Date(c.createdAt).getTime() <= endTime);
    }
  }

  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === 'PENDING').length;
  const inProgress = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolved = complaints.filter((c) => c.status === 'RESOLVED').length;

  // Resolution Rate: resolved / total * 100 (handles total = 0 without error)
  const resolutionRate = total === 0 ? 0 : Math.round((resolved / total) * 1000) / 10;

  // Average Resolution Time (only include resolved complaints)
  const resolvedList = complaints.filter((c) => c.status === 'RESOLVED' && c.resolvedAt);
  let totalResolutionHours = 0;

  for (const c of resolvedList) {
    const created = new Date(c.createdAt).getTime();
    const resTime = new Date(c.resolvedAt!).getTime();
    if (resTime > created) {
      totalResolutionHours += (resTime - created) / 3600000;
    }
  }

  const avgHours = resolvedList.length === 0 ? 0 : Math.round((totalResolutionHours / resolvedList.length) * 10) / 10;
  const fullHours = Math.floor(avgHours);
  const minutes = Math.round((avgHours - fullHours) * 60);
  const formattedAvg = avgHours === 0 ? '0h 0m' : `${fullHours}h ${minutes}m`;

  // Breakdown by Category
  const categoryCounts: Record<ComplaintCategory, number> = {
    FURNITURE: 0,
    ELECTRICAL: 0,
    WATER_LEAKAGE: 0,
    CLASSROOM_MAINTENANCE: 0,
    OTHER: 0,
  };
  for (const c of complaints) {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  }
  const complaintsByCategory = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat as ComplaintCategory,
    count,
    percentage: total === 0 ? 0 : Math.round((count / total) * 100),
  }));

  // Breakdown by Status
  const statusCounts: Record<ComplaintStatus, number> = {
    PENDING: pending,
    IN_PROGRESS: inProgress,
    RESOLVED: resolved,
  };
  const complaintsByStatus = Object.entries(statusCounts).map(([st, count]) => ({
    status: st as ComplaintStatus,
    count,
    percentage: total === 0 ? 0 : Math.round((count / total) * 100),
  }));

  // Breakdown by Priority
  const priorityCounts: Record<ComplaintPriority, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0,
  };
  for (const c of complaints) {
    priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
  }
  const complaintsByPriority = Object.entries(priorityCounts).map(([pri, count]) => ({
    priority: pri as ComplaintPriority,
    count,
    percentage: total === 0 ? 0 : Math.round((count / total) * 100),
  }));

  // 30-Day Trend (reported vs resolved by day)
  const daysWindow = range === '7d' ? 7 : range === 'today' ? 1 : 30;
  const trendMap: Record<string, { date: string; reported: number; resolved: number }> = {};

  for (let i = daysWindow - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    trendMap[dateStr] = { date: dateStr, reported: 0, resolved: 0 };
  }

  for (const c of db.getComplaints()) {
    const createdDate = c.createdAt.split('T')[0];
    if (trendMap[createdDate]) {
      trendMap[createdDate].reported++;
    }
    if (c.resolvedAt) {
      const resolvedDate = c.resolvedAt.split('T')[0];
      if (trendMap[resolvedDate]) {
        trendMap[resolvedDate].resolved++;
      }
    }
  }

  const trend = Object.values(trendMap);

  const statsPayload = {
    total,
    pending,
    inProgress,
    resolved,
    resolutionRate,
    averageResolutionTime: {
      hours: avgHours,
      formatted: formattedAvg,
    },
    complaintsByCategory,
    complaintsByStatus,
    complaintsByPriority,
    recentComplaints: complaints.slice(0, 5).map(enrichComplaint),
    trend,
  };

  return res.status(200).json({
    success: true,
    stats: statsPayload,
    statistics: statsPayload,
  });
};

// 10. Notifications
export const getNotifications = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const notifs = db.getNotificationsForUser(req.user.id);
  return res.status(200).json({
    success: true,
    notifications: notifs,
  });
};

export const markNotificationAsRead = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const { id } = req.params;
  const ok = db.markNotificationRead(id, req.user.id);

  return res.status(200).json({
    success: ok,
  });
};

// 11. Maintenance Staff List (for assignment dropdown)
export const getMaintenanceStaff = (_req: AuthenticatedRequest, res: Response) => {
  const staff = db
    .getUsers()
    .filter((u) => u.role === 'MAINTENANCE' || u.role === 'ADMIN')
    .map(({ password: _, ...safe }) => safe);

  return res.status(200).json({
    success: true,
    staff,
  });
};
