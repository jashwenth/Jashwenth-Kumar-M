// ============================================================
// CampusPulse — Unified Reactive Data Store
//
// Manages reactive local state + persistence for Incidents,
// Activity Logs, Assets, and Feedback. Emits change events
// so all UI views (Dashboard, Feed, Heatmap, Chatbot)
// stay 100% in sync without reload.
// ============================================================

import { MOCK_INCIDENTS } from '../data/mockIncidents';
import { MOCK_ASSETS } from '../data/mockAssets';
import { calculateSLA, calculateSLADeadline } from './rules';
import type { Incident, ActivityLog, Status, ReportFormData, AIAnalysisResult } from '../types/incident';
import type { Asset, ResolutionFeedback, SubmitFeedbackData } from '../types/asset';

const STORAGE_INCIDENTS_KEY = 'campuspulse_incidents_v2';
const STORAGE_LOGS_KEY = 'campuspulse_logs_v2';
const STORAGE_FEEDBACK_KEY = 'campuspulse_feedback_v2';
const STORAGE_ASSETS_KEY = 'campuspulse_assets_v2';
const EVENT_NAME = 'campuspulse_state_changed';

function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSetJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Storage write error:', err);
  }
}

// Initial seed activity logs
function generateInitialLogs(incidents: Incident[]): Record<string, ActivityLog[]> {
  const map: Record<string, ActivityLog[]> = {};
  for (const inc of incidents) {
    const logs: ActivityLog[] = [
      {
        id: `log-init-1-${inc.id}`,
        incident_id: inc.id,
        action: 'Incident Reported',
        details: `Report filed by ${inc.reporter_name || 'Student'}`,
        actor: 'Student',
        created_at: inc.created_at,
      },
    ];

    if (inc.ai_tagged) {
      logs.push({
        id: `log-init-2-${inc.id}`,
        incident_id: inc.id,
        action: 'AI Triage Completed',
        details: `Classified as ${inc.category} (${inc.severity} priority) → Routed to ${inc.department}`,
        actor: 'CampusPulse AI',
        created_at: new Date(new Date(inc.created_at).getTime() + 15000).toISOString(),
      });
    }

    if (inc.status === 'In Progress' || inc.status === 'Fixed') {
      logs.push({
        id: `log-init-3-${inc.id}`,
        incident_id: inc.id,
        action: 'Maintenance Assigned',
        details: `Work order dispatched to ${inc.department}`,
        actor: 'Operations Team',
        created_at: new Date(new Date(inc.created_at).getTime() + 60000).toISOString(),
      });
    }

    if (inc.status === 'Fixed' && inc.resolved_at) {
      logs.push({
        id: `log-init-4-${inc.id}`,
        incident_id: inc.id,
        action: 'Issue Resolved',
        details: 'Repairs completed and operational verification passed',
        actor: 'Lead Technician',
        created_at: inc.resolved_at,
      });
    }

    map[inc.id] = logs;
  }
  return map;
}

class CampusStore {
  private incidents: Incident[];
  private assets: Asset[];
  private logs: Record<string, ActivityLog[]>;
  private feedbacks: Record<string, ResolutionFeedback>;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.incidents = safeGetJSON<Incident[]>(STORAGE_INCIDENTS_KEY, MOCK_INCIDENTS);
    this.assets = safeGetJSON<Asset[]>(STORAGE_ASSETS_KEY, MOCK_ASSETS);
    this.logs = safeGetJSON<Record<string, ActivityLog[]>>(
      STORAGE_LOGS_KEY,
      generateInitialLogs(this.incidents)
    );
    this.feedbacks = safeGetJSON<Record<string, ResolutionFeedback>>(STORAGE_FEEDBACK_KEY, {});

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_INCIDENTS_KEY) {
          this.incidents = safeGetJSON<Incident[]>(STORAGE_INCIDENTS_KEY, MOCK_INCIDENTS);
          this.notify();
        }
      });
    }
  }

  private notify() {
    safeSetJSON(STORAGE_INCIDENTS_KEY, this.incidents);
    safeSetJSON(STORAGE_LOGS_KEY, this.logs);
    safeSetJSON(STORAGE_FEEDBACK_KEY, this.feedbacks);
    safeSetJSON(STORAGE_ASSETS_KEY, this.assets);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(EVENT_NAME));
    }
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Getters
  public getIncidents(): Incident[] {
    return [...this.incidents];
  }

  public getIncidentById(id: string): Incident | null {
    return this.incidents.find((i) => i.id === id) || null;
  }

  public getAssets(): Asset[] {
    return [...this.assets];
  }

  public getAssetById(id: string): Asset | null {
    return this.assets.find((a) => a.id === id) || null;
  }

  public getActivityLogs(incidentId: string): ActivityLog[] {
    return this.logs[incidentId] || [];
  }

  public getFeedback(incidentId: string): ResolutionFeedback | null {
    return this.feedbacks[incidentId] || null;
  }

  // Create Incident
  public createIncident(
    formData: ReportFormData,
    aiResult: AIAnalysisResult,
    imageUrl: string | null = null
  ): Incident {
    // Generate next CP- ID
    const maxNum = this.incidents.reduce((max, inc) => {
      const match = inc.id.match(/CP-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 1066);

    const newId = `CP-${maxNum + 1}`;
    const now = new Date().toISOString();
    const slaHours = calculateSLA(aiResult.severity);
    const slaDeadline = calculateSLADeadline(now, slaHours);

    const newIncident: Incident = {
      id: newId,
      title: aiResult.subcategory && aiResult.subcategory !== 'General'
        ? `${aiResult.subcategory} – ${formData.location}`
        : aiResult.summary.slice(0, 60),
      description: formData.description,
      image_url: imageUrl,
      category: aiResult.category,
      subcategory: aiResult.subcategory,
      severity: aiResult.severity,
      location: formData.location,
      floor: formData.floor || null,
      department: aiResult.department,
      status: 'Open',
      sla_hours: slaHours,
      sla_deadline: slaDeadline,
      report_count: 1,
      ai_tagged: true,
      ai_summary: aiResult.summary,
      keywords: aiResult.keywords,
      reporter_id: formData.reporter_id || 'stu-curr',
      reporter_email: formData.reporter_email || 'student@wales.edu',
      reporter_name: formData.reporter_name || 'Campus Student',
      asset_id: formData.asset_id || null,
      created_at: now,
      updated_at: now,
      resolved_at: null,
    };

    this.incidents.unshift(newIncident);

    // Initial activity logs
    const initialLogs: ActivityLog[] = [
      {
        id: `log-${Date.now()}-1`,
        incident_id: newId,
        action: 'Incident Reported',
        details: `Issue reported at ${formData.location}${formData.floor ? ` (${formData.floor})` : ''}`,
        actor: formData.reporter_name || 'Student',
        created_at: now,
      },
      {
        id: `log-${Date.now()}-2`,
        incident_id: newId,
        action: 'AI Triage Completed',
        details: `Detected ${aiResult.category} [${aiResult.severity}] → Routed to ${aiResult.department}`,
        actor: 'CampusPulse AI',
        created_at: new Date(Date.now() + 500).toISOString(),
      },
      {
        id: `log-${Date.now()}-3`,
        incident_id: newId,
        action: 'Assigned to Department',
        details: `Dispatched SLA: ${slaHours}h response deadline`,
        actor: 'System',
        created_at: new Date(Date.now() + 1000).toISOString(),
      },
    ];

    this.logs[newId] = initialLogs;

    // If an asset was linked, update asset status if severe
    if (formData.asset_id && (aiResult.severity === 'High' || aiResult.severity === 'Critical')) {
      const asset = this.assets.find((a) => a.id === formData.asset_id);
      if (asset) {
        asset.status = 'Under Repair';
      }
    }

    this.notify();
    return newIncident;
  }

  // Update Status
  public updateIncidentStatus(
    id: string,
    newStatus: Status,
    actorName: string = 'Operations Team'
  ): Incident | null {
    const incIndex = this.incidents.findIndex((i) => i.id === id);
    if (incIndex === -1) return null;

    const current = this.incidents[incIndex];
    const now = new Date().toISOString();

    const updated: Incident = {
      ...current,
      status: newStatus,
      updated_at: now,
      resolved_at: newStatus === 'Fixed' ? now : newStatus === 'Open' ? null : current.resolved_at,
    };

    this.incidents[incIndex] = updated;

    const actionText =
      newStatus === 'In Progress'
        ? 'Status Changed to In Progress'
        : newStatus === 'Fixed'
        ? 'Issue Resolved'
        : 'Incident Re-opened';

    const detailText =
      newStatus === 'In Progress'
        ? 'Technician dispatched on site; maintenance in progress.'
        : newStatus === 'Fixed'
        ? 'Repairs complete. Marked as fixed. Verification requested.'
        : 'Incident reopened for further investigation.';

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      incident_id: id,
      action: actionText,
      details: detailText,
      actor: actorName,
      created_at: now,
    };

    if (!this.logs[id]) this.logs[id] = [];
    this.logs[id].push(newLog);

    // If asset was resolved
    if (updated.asset_id && newStatus === 'Fixed') {
      const asset = this.assets.find((a) => a.id === updated.asset_id);
      if (asset) {
        asset.status = 'Active';
        asset.last_serviced = now.split('T')[0];
      }
    }

    this.notify();
    return updated;
  }

  // Submit Feedback
  public submitResolutionFeedback(data: SubmitFeedbackData, reporterName: string = 'Student'): ResolutionFeedback {
    const now = new Date().toISOString();
    const feedback: ResolutionFeedback = {
      id: `fb-${Date.now()}`,
      incident_id: data.incident_id,
      reporter_id: 'stu-curr',
      rating: data.rating,
      comment: data.comment || null,
      is_issue_actually_fixed: data.is_issue_actually_fixed,
      created_at: now,
    };

    this.feedbacks[data.incident_id] = feedback;

    if (!data.is_issue_actually_fixed) {
      // Reopen incident automatically
      this.updateIncidentStatus(data.incident_id, 'Open', 'System (Student Feedback)');

      const disputeLog: ActivityLog = {
        id: `log-${Date.now()}-dispute`,
        incident_id: data.incident_id,
        action: 'Resolution Disputed',
        details: `Student reported issue was NOT fixed. Rating: ${data.rating}/5 stars. ${data.comment ? `Comment: "${data.comment}"` : ''}`,
        actor: reporterName,
        created_at: now,
      };
      if (!this.logs[data.incident_id]) this.logs[data.incident_id] = [];
      this.logs[data.incident_id].push(disputeLog);
    } else {
      const ratingLog: ActivityLog = {
        id: `log-${Date.now()}-fb`,
        incident_id: data.incident_id,
        action: 'Resolution Feedback Received',
        details: `Student verified resolution: ${data.rating}/5 stars. ${data.comment ? `Comment: "${data.comment}"` : ''}`,
        actor: reporterName,
        created_at: now,
      };
      if (!this.logs[data.incident_id]) this.logs[data.incident_id] = [];
      this.logs[data.incident_id].push(ratingLog);
    }

    this.notify();
    return feedback;
  }

  // Upvote / increment report count on duplicate
  public upvoteIncident(id: string, voterName: string = 'Another Student'): Incident | null {
    const incIndex = this.incidents.findIndex((i) => i.id === id);
    if (incIndex === -1) return null;

    const current = this.incidents[incIndex];
    const updated: Incident = {
      ...current,
      report_count: current.report_count + 1,
      updated_at: new Date().toISOString(),
    };

    this.incidents[incIndex] = updated;

    const log: ActivityLog = {
      id: `log-${Date.now()}-upvote`,
      incident_id: id,
      action: 'Additional Report Linked',
      details: `Report confirmed by ${voterName}. Total report count now: ${updated.report_count}`,
      actor: voterName,
      created_at: new Date().toISOString(),
    };
    if (!this.logs[id]) this.logs[id] = [];
    this.logs[id].push(log);

    this.notify();
    return updated;
  }

  // Reset to initial mock data
  public resetToDefault() {
    this.incidents = [...MOCK_INCIDENTS];
    this.assets = [...MOCK_ASSETS];
    this.logs = generateInitialLogs(this.incidents);
    this.feedbacks = {};
    this.notify();
  }
}

export const campusStore = new CampusStore();
