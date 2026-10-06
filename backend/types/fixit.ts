export type UserRole = 'STUDENT' | 'STAFF' | 'MAINTENANCE' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  password?: string;
  createdAt: string;
  updatedAt: string;
}

export type ComplaintCategory =
  | 'FURNITURE'
  | 'ELECTRICAL'
  | 'WATER_LEAKAGE'
  | 'CLASSROOM_MAINTENANCE'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export type ActivityAction =
  | 'COMPLAINT_SUBMITTED'
  | 'PRIORITY_CHANGED'
  | 'ASSIGNED'
  | 'STAFF_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'STATUS_UPDATED'
  | 'REMARK_ADDED'
  | 'REMARKS_ADDED'
  | 'RESOLVED';

export interface Complaint {
  id: string;
  complaintId: string; // e.g. "FX-1024"
  reporterId: string;
  category: ComplaintCategory;
  description: string;
  building: string;
  floor: string;
  roomNumber: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  photoUrl: string | null;
  assignedStaffId: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface ComplaintActivity {
  id: string;
  complaintId: string;
  userId: string;
  action: ActivityAction;
  oldValue: string | null;
  newValue: string | null;
  details: string | null;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  complaintId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ComplaintWithDetails extends Complaint {
  reporter?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
  };
  assignedStaff?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
  } | null;
  activities?: Array<ComplaintActivity & { user?: { name: string; role: UserRole } }>;
}
