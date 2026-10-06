// ============================================================
// CampusPulse — Asset Types (QR Code System)
// ============================================================

export type AssetType =
  | 'AC'
  | 'Fan'
  | 'Light'
  | 'Projector'
  | 'Router'
  | 'Switch'
  | 'Printer'
  | 'Computer'
  | 'Water Purifier'
  | 'Generator'
  | 'Elevator'
  | 'Fire Extinguisher'
  | 'CCTV'
  | 'Intercom'
  | 'Washing Machine'
  | 'Vending Machine'
  | 'Other';

export interface Asset {
  id: string;                    // "AST-0001"
  name: string;
  asset_type: AssetType;
  model: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  location: string;
  floor: string | null;
  room: string | null;
  installation_date: string | null;
  warranty_expiry: string | null;
  last_serviced: string | null;
  status: 'Active' | 'Under Repair' | 'Decommissioned';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Data returned when a QR code is scanned */
export interface QRScanData {
  asset_id: string;
  asset_name: string;
  asset_type: AssetType;
  model: string | null;
  serial_number: string | null;
  location: string;
  floor: string | null;
  room: string | null;
  warranty_status: 'Under Warranty' | 'Expired' | 'Unknown';
}

/** Data for creating a new asset */
export interface CreateAssetData {
  name: string;
  asset_type: AssetType;
  model?: string;
  serial_number?: string;
  manufacturer?: string;
  location: string;
  floor?: string;
  room?: string;
  installation_date?: string;
  warranty_expiry?: string;
  notes?: string;
}

/** Feedback types */
export interface ResolutionFeedback {
  id: string;
  incident_id: string;
  reporter_id: string | null;
  rating: number;            // 1-5
  comment: string | null;
  is_issue_actually_fixed: boolean;
  created_at: string;
}

export interface SubmitFeedbackData {
  incident_id: string;
  rating: number;
  comment?: string;
  is_issue_actually_fixed: boolean;
}

/** Notification record */
export interface NotificationRecord {
  id: string;
  incident_id: string;
  recipient_email: string;
  recipient_name: string | null;
  notification_type: 'resolution' | 'status_update' | 'escalation' | 'feedback_request';
  subject: string;
  sent_at: string;
  delivery_status: 'sent' | 'delivered' | 'failed' | 'bounced';
  brevo_message_id: string | null;
  error_message: string | null;
}

/** Asset type icon mapping for UI */
export const ASSET_TYPE_ICONS: Record<AssetType, string> = {
  AC: '❄️',
  Fan: '🌀',
  Light: '💡',
  Projector: '📽️',
  Router: '📶',
  Switch: '🔌',
  Printer: '🖨️',
  Computer: '💻',
  'Water Purifier': '💧',
  Generator: '⚡',
  Elevator: '🛗',
  'Fire Extinguisher': '🧯',
  CCTV: '📹',
  Intercom: '📞',
  'Washing Machine': '🫧',
  'Vending Machine': '🥤',
  Other: '📦',
};
