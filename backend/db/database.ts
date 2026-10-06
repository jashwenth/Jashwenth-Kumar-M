import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  User,
  Complaint,
  ComplaintActivity,
  Notification,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../types/fixit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'fixit-db.json');

interface DatabaseSchema {
  users: User[];
  complaints: Complaint[];
  activities: ComplaintActivity[];
  notifications: Notification[];
}

// Generate realistic timestamps relative to now (2026-10-06)
const now = new Date('2026-10-06T00:45:00.000Z');
const daysAgo = (d: number, hours: number = 0) =>
  new Date(now.getTime() - (d * 86400000 + hours * 3600000)).toISOString();

const SEED_USERS: User[] = [
  {
    id: 'usr_student_1',
    name: 'Alex Chen',
    email: 'alex@wales.edu',
    password: 'password123',
    role: 'STUDENT',
    department: 'Computer Science',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: 'usr_staff_1',
    name: 'Dr. Robert Vance',
    email: 'robert.vance@wales.edu',
    password: 'password123',
    role: 'STAFF',
    department: 'Physics Department',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: 'usr_maint_1',
    name: 'Dave Miller',
    email: 'dave.maintenance@wales.edu',
    password: 'password123',
    role: 'MAINTENANCE',
    department: 'Plumbing & Mechanical',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: 'usr_maint_2',
    name: 'Sarah Connor',
    email: 'sarah.maintenance@wales.edu',
    password: 'password123',
    role: 'MAINTENANCE',
    department: 'Electrical Infrastructure',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: 'usr_admin_1',
    name: 'Eleanor Wright',
    email: 'admin@wales.edu',
    password: 'password123',
    role: 'ADMIN',
    department: 'Campus Facilities Administration',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
];

const SEED_COMPLAINTS: Complaint[] = [
  {
    id: 'c_1024',
    complaintId: 'FX-1024',
    reporterId: 'usr_student_1',
    category: 'WATER_LEAKAGE',
    description: 'Water leakage in Block A, Floor 2, Room 204 near the radiator pipe valve.',
    building: 'Block A',
    floor: '2',
    roomNumber: '204',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    photoUrl: null,
    assignedStaffId: 'usr_maint_1',
    remarks: 'Plumbing team inspected valve. Gasket replacement in progress.',
    createdAt: daysAgo(2, 4),
    updatedAt: daysAgo(1, 2),
    resolvedAt: null,
  },
  {
    id: 'c_1025',
    complaintId: 'FX-1025',
    reporterId: 'usr_student_1',
    category: 'FURNITURE',
    description: 'Broken classroom chair in Block B, Room 108 with detached armrest.',
    building: 'Block B',
    floor: '1',
    roomNumber: '108',
    priority: 'LOW',
    status: 'PENDING',
    photoUrl: null,
    assignedStaffId: null,
    remarks: null,
    createdAt: daysAgo(1, 1),
    updatedAt: daysAgo(1, 1),
    resolvedAt: null,
  },
  {
    id: 'c_1026',
    complaintId: 'FX-1026',
    reporterId: 'usr_staff_1',
    category: 'ELECTRICAL',
    description: 'Ceiling fan not working in Lab 3, capacitor seems blown.',
    building: 'Block A',
    floor: '3',
    roomNumber: 'Lab 3',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    photoUrl: null,
    assignedStaffId: 'usr_maint_2',
    remarks: 'New capacitor installed and fan speed regulator tested. Operational.',
    createdAt: daysAgo(4, 6),
    updatedAt: daysAgo(3, 1),
    resolvedAt: daysAgo(3, 1),
  },
  {
    id: 'c_1027',
    complaintId: 'FX-1027',
    reporterId: 'usr_staff_1',
    category: 'ELECTRICAL',
    description: 'Electrical socket damaged near Room 302 with exposed sparks when plugged in.',
    building: 'Block B',
    floor: '3',
    roomNumber: '302',
    priority: 'CRITICAL',
    status: 'IN_PROGRESS',
    photoUrl: null,
    assignedStaffId: 'usr_maint_2',
    remarks: 'Circuit isolated at the breaker panel. Replacement box ordered.',
    createdAt: daysAgo(0, 10),
    updatedAt: daysAgo(0, 5),
    resolvedAt: null,
  },
  {
    id: 'c_1020',
    complaintId: 'FX-1020',
    reporterId: 'usr_student_1',
    category: 'CLASSROOM_MAINTENANCE',
    description: 'Projector display screen cable is loose and colors are washed out in Lecture Hall 1.',
    building: 'Block A',
    floor: '1',
    roomNumber: 'LH-1',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    photoUrl: null,
    assignedStaffId: 'usr_maint_2',
    remarks: 'HDMI repeater cable re-routed and projector aligned.',
    createdAt: daysAgo(7, 3),
    updatedAt: daysAgo(5, 8),
    resolvedAt: daysAgo(5, 8),
  },
  {
    id: 'c_1021',
    complaintId: 'FX-1021',
    reporterId: 'usr_staff_1',
    category: 'WATER_LEAKAGE',
    description: 'Continuous dripping from the main washroom tap on Ground Floor of Library.',
    building: 'Library',
    floor: 'Ground',
    roomNumber: 'G-Washroom',
    priority: 'HIGH',
    status: 'RESOLVED',
    photoUrl: null,
    assignedStaffId: 'usr_maint_1',
    remarks: 'Washer replaced and pressure regulator tightened.',
    createdAt: daysAgo(12, 5),
    updatedAt: daysAgo(11, 2),
    resolvedAt: daysAgo(11, 2),
  },
  {
    id: 'c_1022',
    complaintId: 'FX-1022',
    reporterId: 'usr_student_1',
    category: 'OTHER',
    description: 'Door lock mechanism jammed on study room 412, door does not latch shut.',
    building: 'Library',
    floor: '4',
    roomNumber: '412',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    photoUrl: null,
    assignedStaffId: 'usr_maint_1',
    remarks: 'Mortise lock replaced with new master-keyed cylinder.',
    createdAt: daysAgo(18, 4),
    updatedAt: daysAgo(17, 1),
    resolvedAt: daysAgo(17, 1),
  },
  {
    id: 'c_1023',
    complaintId: 'FX-1023',
    reporterId: 'usr_staff_1',
    category: 'FURNITURE',
    description: 'Whiteboard mounting brackets coming loose in Seminar Room 201.',
    building: 'Block B',
    floor: '2',
    roomNumber: '201',
    priority: 'LOW',
    status: 'RESOLVED',
    photoUrl: null,
    assignedStaffId: 'usr_maint_1',
    remarks: 'Heavy-duty wall anchors installed.',
    createdAt: daysAgo(24, 6),
    updatedAt: daysAgo(23, 2),
    resolvedAt: daysAgo(23, 2),
  },
];

const SEED_ACTIVITIES: ComplaintActivity[] = [
  // FX-1024
  {
    id: 'act_1024_1',
    complaintId: 'c_1024',
    userId: 'usr_student_1',
    action: 'COMPLAINT_SUBMITTED',
    oldValue: null,
    newValue: null,
    details: 'Complaint submitted by Alex Chen',
    createdAt: daysAgo(2, 4),
  },
  {
    id: 'act_1024_2',
    complaintId: 'c_1024',
    userId: 'usr_admin_1',
    action: 'ASSIGNED',
    oldValue: null,
    newValue: 'Dave Miller',
    details: 'Complaint assigned to Dave Miller (Plumbing & Mechanical)',
    createdAt: daysAgo(2, 2),
  },
  {
    id: 'act_1024_3',
    complaintId: 'c_1024',
    userId: 'usr_maint_1',
    action: 'STATUS_CHANGED',
    oldValue: 'PENDING',
    newValue: 'IN_PROGRESS',
    details: 'Inspection initiated on Floor 2',
    createdAt: daysAgo(1, 2),
  },
  {
    id: 'act_1024_4',
    complaintId: 'c_1024',
    userId: 'usr_maint_1',
    action: 'REMARK_ADDED',
    oldValue: null,
    newValue: null,
    details: 'Plumbing team inspected valve. Gasket replacement in progress.',
    createdAt: daysAgo(1, 2),
  },
  // FX-1025
  {
    id: 'act_1025_1',
    complaintId: 'c_1025',
    userId: 'usr_student_1',
    action: 'COMPLAINT_SUBMITTED',
    oldValue: null,
    newValue: null,
    details: 'Complaint submitted by Alex Chen',
    createdAt: daysAgo(1, 1),
  },
  // FX-1026
  {
    id: 'act_1026_1',
    complaintId: 'c_1026',
    userId: 'usr_staff_1',
    action: 'COMPLAINT_SUBMITTED',
    oldValue: null,
    newValue: null,
    details: 'Complaint submitted by Dr. Robert Vance',
    createdAt: daysAgo(4, 6),
  },
  {
    id: 'act_1026_2',
    complaintId: 'c_1026',
    userId: 'usr_admin_1',
    action: 'ASSIGNED',
    oldValue: null,
    newValue: 'Sarah Connor',
    details: 'Assigned to Sarah Connor',
    createdAt: daysAgo(4, 3),
  },
  {
    id: 'act_1026_3',
    complaintId: 'c_1026',
    userId: 'usr_maint_2',
    action: 'STATUS_CHANGED',
    oldValue: 'PENDING',
    newValue: 'IN_PROGRESS',
    details: 'Field diagnostic started in Lab 3',
    createdAt: daysAgo(3, 8),
  },
  {
    id: 'act_1026_4',
    complaintId: 'c_1026',
    userId: 'usr_maint_2',
    action: 'RESOLVED',
    oldValue: 'IN_PROGRESS',
    newValue: 'RESOLVED',
    details: 'New capacitor installed and fan speed regulator tested. Operational.',
    createdAt: daysAgo(3, 1),
  },
  // FX-1027
  {
    id: 'act_1027_1',
    complaintId: 'c_1027',
    userId: 'usr_staff_1',
    action: 'COMPLAINT_SUBMITTED',
    oldValue: null,
    newValue: null,
    details: 'Complaint submitted by Dr. Robert Vance',
    createdAt: daysAgo(0, 10),
  },
  {
    id: 'act_1027_2',
    complaintId: 'c_1027',
    userId: 'usr_admin_1',
    action: 'PRIORITY_CHANGED',
    oldValue: 'HIGH',
    newValue: 'CRITICAL',
    details: 'Elevated to CRITICAL due to fire hazard and sparking',
    createdAt: daysAgo(0, 8),
  },
  {
    id: 'act_1027_3',
    complaintId: 'c_1027',
    userId: 'usr_admin_1',
    action: 'ASSIGNED',
    oldValue: null,
    newValue: 'Sarah Connor',
    details: 'Emergency dispatch to Sarah Connor',
    createdAt: daysAgo(0, 7),
  },
  {
    id: 'act_1027_4',
    complaintId: 'c_1027',
    userId: 'usr_maint_2',
    action: 'STATUS_CHANGED',
    oldValue: 'PENDING',
    newValue: 'IN_PROGRESS',
    details: 'Circuit isolated at the breaker panel. Replacement box ordered.',
    createdAt: daysAgo(0, 5),
  },
];

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_1',
    userId: 'usr_student_1',
    complaintId: 'c_1024',
    title: 'Complaint Update: FX-1024',
    message: 'Your complaint has been assigned to Dave Miller and is now IN PROGRESS.',
    read: false,
    createdAt: daysAgo(1, 2),
  },
  {
    id: 'notif_2',
    userId: 'usr_staff_1',
    complaintId: 'c_1026',
    title: 'Complaint Resolved: FX-1026',
    message: 'Ceiling fan in Lab 3 has been marked RESOLVED by Sarah Connor.',
    read: true,
    createdAt: daysAgo(3, 1),
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading fixit-db.json, using defaults:', e);
    }

    const initialData: DatabaseSchema = {
      users: SEED_USERS,
      complaints: SEED_COMPLAINTS,
      activities: SEED_ACTIVITIES,
      notifications: SEED_NOTIFICATIONS,
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing fixit-db.json:', e);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return [...this.data.users];
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  // --- Complaints ---
  public getComplaints(): Complaint[] {
    return [...this.data.complaints];
  }

  public getComplaintById(id: string): Complaint | undefined {
    return this.data.complaints.find((c) => c.id === id || c.complaintId.toUpperCase() === id.toUpperCase());
  }

  public getNextComplaintId(): string {
    let max = 1027;
    for (const c of this.data.complaints) {
      const match = c.complaintId.match(/FX-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
    return `FX-${max + 1}`;
  }

  public createComplaint(complaint: Complaint): Complaint {
    this.data.complaints.unshift(complaint);
    this.saveData();
    return complaint;
  }

  public updateComplaint(id: string, updates: Partial<Complaint>): Complaint | undefined {
    const idx = this.data.complaints.findIndex((c) => c.id === id || c.complaintId === id);
    if (idx === -1) return undefined;

    const updated = {
      ...this.data.complaints[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.complaints[idx] = updated;
    this.saveData();
    return updated;
  }

  // --- Activities ---
  public getActivitiesForComplaint(complaintId: string): ComplaintActivity[] {
    return this.data.activities
      .filter((a) => a.complaintId === complaintId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public createActivity(activity: ComplaintActivity): ComplaintActivity {
    this.data.activities.push(activity);
    this.saveData();
    return activity;
  }

  // --- Notifications ---
  public getNotificationsForUser(userId: string): Notification[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createNotification(notif: Notification): Notification {
    this.data.notifications.unshift(notif);
    this.saveData();
    return notif;
  }

  public markNotificationRead(id: string, userId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === id && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.saveData();
      return true;
    }
    return false;
  }

  // Reset database for test/demo
  public reset(): void {
    this.data = {
      users: [...SEED_USERS],
      complaints: [...SEED_COMPLAINTS],
      activities: [...SEED_ACTIVITIES],
      notifications: [...SEED_NOTIFICATIONS],
    };
    this.saveData();
  }
}

export const db = new Database();
