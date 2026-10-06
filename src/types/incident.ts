// ============================================================
// CampusPulse — Shared Type Contract
// EVERY component builds against these types.
// Do NOT modify without telling your teammate.
// ============================================================

// ---------- Enums as union types ----------

export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export type Status = 'Open' | 'In Progress' | 'Fixed';

export type Category =
  | 'Electrical'
  | 'Plumbing'
  | 'WiFi'
  | 'Cleanliness'
  | 'Infrastructure'
  | 'Facilities'
  | 'Safety'
  | 'Other';

// ---------- Core Incident ----------

export interface Incident {
  id: string;                    // "CP-1042"
  title: string;
  description: string;
  image_url: string | null;
  category: Category;
  subcategory: string | null;
  severity: Severity;
  location: string;              // "Block B"
  floor: string | null;          // "2nd Floor"
  department: string;
  status: Status;
  sla_hours: number;
  sla_deadline: string | null;   // ISO timestamp
  report_count: number;
  ai_tagged: boolean;
  ai_summary: string | null;
  keywords: string[];
  reporter_id: string | null;    // UUID — references profiles.id
  reporter_email: string | null; // For email notifications
  reporter_name: string | null;  // Display name
  asset_id: string | null;       // References assets.id (QR code link)
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  resolved_at: string | null;    // ISO timestamp
}

// ---------- AI Analysis Output ----------

export interface AIAnalysisResult {
  category: Category;
  subcategory: string;
  severity: Severity;
  summary: string;
  department: string;
  suggested_sla_hours: number;
  keywords: string[];
}

// ---------- Activity Log ----------

export interface ActivityLog {
  id: string;
  incident_id: string;
  action: string;
  details: string | null;
  actor: string;
  created_at: string;
}

// ---------- Incident Relation ----------

export interface IncidentRelation {
  id: string;
  incident_id: string;
  related_incident_id: string;
  similarity: number;
  created_at: string;
}

// ---------- Incident Stats (for KPI bar) ----------

export interface IncidentStats {
  total_open: number;
  total_high_priority: number;
  total_overdue: number;
  total_fixed_today: number;
  total_in_progress: number;
}

// ---------- Location Heatmap Data ----------

export interface LocationHeatmapData {
  location: string;
  total_incidents: number;
  open_incidents: number;
  worst_severity: Severity;
  top_category: string;
  categories: Record<string, number>;
}

// ---------- Recurring Pattern ----------

export interface RecurringPattern {
  is_recurring: boolean;
  count: number;
  location: string;
  category: string;
  days: number;
  message: string | null;
}

// ---------- Chatbot Message ----------

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// ---------- Report Form Data ----------

export interface ReportFormData {
  description: string;
  image: File | null;
  location: string;
  floor: string;
  reporter_id?: string;     // From auth session
  reporter_email?: string;  // From auth session
  reporter_name?: string;   // From auth session
  asset_id?: string;        // From QR code scan (query param)
}

// ---------- Constants ----------

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'Electrical', label: 'Electrical', icon: '💡' },
  { value: 'Plumbing', label: 'Plumbing', icon: '💧' },
  { value: 'WiFi', label: 'Wi-Fi', icon: '📶' },
  { value: 'Cleanliness', label: 'Cleanliness', icon: '🧹' },
  { value: 'Infrastructure', label: 'Infrastructure', icon: '🪑' },
  { value: 'Facilities', label: 'Facilities', icon: '🚪' },
  { value: 'Safety', label: 'Safety', icon: '🛡️' },
  { value: 'Other', label: 'Other', icon: '📋' },
];

export const LOCATIONS = [
  'Block A',
  'Block B',
  'Library',
  'Hostel 1',
  'Hostel 2',
  'Cafeteria',
  'Sports Complex',
  'Admin Block',
] as const;

export const FLOORS = [
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
] as const;

export const SEVERITY_ORDER: Record<Severity, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  Low: '#22c55e',       // green-500
  Medium: '#eab308',    // yellow-500
  High: '#f97316',      // orange-500
  Critical: '#ef4444',  // red-500
};

export const STATUS_COLORS: Record<Status, string> = {
  Open: '#ef4444',        // red-500
  'In Progress': '#eab308', // yellow-500
  Fixed: '#22c55e',       // green-500
};
