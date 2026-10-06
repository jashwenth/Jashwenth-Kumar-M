// ============================================================
// CampusPulse — Incident CRUD Operations
//
// All database operations for incidents, activity logs, and
// status management. This is the core "backend" that every
// UI component calls.
// ============================================================

import { supabase } from './supabase';
import { analyzeIncident, fileToBase64 } from './ai';
import { calculateSLA, calculateSLADeadline } from './rules';
import { findSimilarIncidents } from './duplicates';
import { sendResolutionEmail, sendStatusUpdateEmail } from './notifications';
import type {
  Incident,
  AIAnalysisResult,
  ActivityLog,
  ReportFormData,
  Status,
  LocationHeatmapData,
  Severity,
} from '../types/incident';
import { SEVERITY_ORDER } from '../types/incident';

// ---------- Submit a New Report ----------

export interface SubmitReportResult {
  incident: Incident;
  aiResult: AIAnalysisResult;
  similarIncidents: Incident[];
  aiAvailable: boolean;
}

/**
 * Complete workflow for submitting a new incident report:
 * 1. Upload photo to Supabase Storage
 * 2. Call AI for classification
 * 3. Apply rule engine (SLA, department)
 * 4. Insert incident into database
 * 5. Create activity log entries
 * 6. Find similar incidents
 */
export async function submitReport(
  formData: ReportFormData,
): Promise<SubmitReportResult> {
  let imageUrl: string | null = null;
  let imageBase64: string | null = null;
  let imageMimeType: string | null = null;

  // 1. Upload photo if provided
  if (formData.image) {
    // Convert to base64 for AI analysis
    const base64Result = await fileToBase64(formData.image);
    if (base64Result) {
      imageBase64 = base64Result.base64;
      imageMimeType = base64Result.mimeType;
    }

    // Upload to Supabase Storage
    const fileName = `incidents/${Date.now()}_${formData.image.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('incident-photos')
      .upload(fileName, formData.image, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Incidents] Photo upload failed:', uploadError);
      // Don't fail the whole report — continue without photo
    } else if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('incident-photos')
        .getPublicUrl(uploadData.path);
      imageUrl = urlData.publicUrl;
    }
  }

  // 2. Call AI for classification
  let aiAvailable = true;
  const aiResult = await analyzeIncident(
    formData.description,
    imageBase64,
    imageMimeType,
    formData.location,
    formData.floor,
  );

  // Check if AI was actually used (if no API key, it used fallback)
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    aiAvailable = false;
  }

  // 3. Apply rule engine — override AI's SLA with our deterministic rules
  const slaHours = calculateSLA(aiResult.severity);
  const now = new Date().toISOString();
  const slaDeadline = calculateSLADeadline(now, slaHours);

  // 4. Insert incident
  const { data: incident, error: insertError } = await supabase
    .from('incidents')
    .insert({
      title: aiResult.subcategory || aiResult.summary.slice(0, 50),
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
      ai_tagged: aiAvailable,
      ai_summary: aiResult.summary,
      keywords: aiResult.keywords,
      reporter_id: formData.reporter_id || null,
      reporter_email: formData.reporter_email || null,
      reporter_name: formData.reporter_name || null,
      asset_id: formData.asset_id || null,
    })
    .select()
    .single();

  if (insertError || !incident) {
    throw new Error(`Failed to create incident: ${insertError?.message || 'Unknown error'}`);
  }

  const typedIncident = incident as Incident;

  // 5. Create activity log entries
  await createActivityLog(typedIncident.id, 'Incident Reported', 'New incident reported by student', 'Student');
  if (aiAvailable) {
    await createActivityLog(
      typedIncident.id,
      'AI Classification Completed',
      `Category: ${aiResult.category} | Severity: ${aiResult.severity} | Department: ${aiResult.department}`,
      'CampusPulse AI',
    );
  }
  await createActivityLog(
    typedIncident.id,
    'Assigned to Department',
    `Routed to ${aiResult.department}`,
    'System',
  );

  // 6. Find similar incidents
  const similarIncidents = await findSimilarIncidents(
    aiResult.category,
    formData.location,
  );
  // Exclude the just-created incident from the similar list
  const filteredSimilar = similarIncidents.filter((i) => i.id !== typedIncident.id);

  return {
    incident: typedIncident,
    aiResult,
    similarIncidents: filteredSimilar,
    aiAvailable,
  };
}

// ---------- Fetch Incidents ----------

/**
 * Fetch all incidents, ordered by creation time (newest first).
 */
export async function fetchAllIncidents(): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Incidents] Error fetching incidents:', error);
    return [];
  }

  return (data as Incident[]) || [];
}

/**
 * Fetch a single incident by ID.
 */
export async function fetchIncidentById(id: string): Promise<Incident | null> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Incidents] Error fetching incident:', error);
    return null;
  }

  return data as Incident;
}

/**
 * Fetch incidents filtered by status.
 */
export async function fetchIncidentsByStatus(status: Status): Promise<Incident[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Incidents] Error fetching incidents by status:', error);
    return [];
  }

  return (data as Incident[]) || [];
}

// ---------- Update Status ----------

/**
 * Update an incident's status and create an activity log.
 */
export async function updateIncidentStatus(
  incidentId: string,
  newStatus: Status,
): Promise<Incident | null> {
  const updateData: Record<string, unknown> = { status: newStatus };

  // If marking as Fixed, set resolved_at (trigger also does this, but be explicit)
  if (newStatus === 'Fixed') {
    updateData.resolved_at = new Date().toISOString();
  }
  // If re-opening, clear resolved_at
  if (newStatus === 'Open') {
    updateData.resolved_at = null;
  }

  const { data, error } = await supabase
    .from('incidents')
    .update(updateData)
    .eq('id', incidentId)
    .select()
    .single();

  if (error) {
    console.error('[Incidents] Error updating status:', error);
    return null;
  }

  const typedIncident = data as Incident;

  // Log the status change
  const actionMap: Record<Status, string> = {
    Open: 'Status Changed to Open',
    'In Progress': 'Status Changed to In Progress',
    Fixed: 'Issue Resolved',
  };

  const detailsMap: Record<Status, string> = {
    Open: 'Incident re-opened',
    'In Progress': 'Maintenance team has started work',
    Fixed: 'Issue has been fixed and verified',
  };

  await createActivityLog(
    incidentId,
    actionMap[newStatus],
    detailsMap[newStatus],
    'Operations',
  );

  // Send email notification to the reporter (async — don't block the UI)
  if (typedIncident.reporter_email) {
    if (newStatus === 'Fixed') {
      // Fire and forget — don't await so the UI stays snappy
      sendResolutionEmail(typedIncident).catch((err) =>
        console.error('[Incidents] Failed to send resolution email:', err)
      );
    } else if (newStatus === 'In Progress') {
      sendStatusUpdateEmail(typedIncident).catch((err) =>
        console.error('[Incidents] Failed to send status update email:', err)
      );
    }
  }

  return typedIncident;
}

// ---------- Activity Logs ----------

/**
 * Create an activity log entry for an incident.
 */
export async function createActivityLog(
  incidentId: string,
  action: string,
  details: string,
  actor: string,
): Promise<void> {
  const { error } = await supabase.from('activity_logs').insert({
    incident_id: incidentId,
    action,
    details,
    actor,
  });

  if (error) {
    console.error('[ActivityLog] Error creating log:', error);
  }
}

/**
 * Fetch all activity logs for an incident, ordered chronologically.
 */
export async function fetchActivityLogs(incidentId: string): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('incident_id', incidentId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[ActivityLog] Error fetching logs:', error);
    return [];
  }

  return (data as ActivityLog[]) || [];
}

// ---------- Heatmap Data ----------

/**
 * Calculate heatmap data grouped by location.
 * Returns aggregate stats for each campus location.
 */
export function calculateHeatmapData(incidents: Incident[]): LocationHeatmapData[] {
  const locationMap = new Map<string, Incident[]>();

  // Group incidents by location
  for (const incident of incidents) {
    const existing = locationMap.get(incident.location) || [];
    existing.push(incident);
    locationMap.set(incident.location, existing);
  }

  // Calculate stats per location
  const result: LocationHeatmapData[] = [];

  for (const [location, locationIncidents] of locationMap) {
    // Count categories
    const categories: Record<string, number> = {};
    let worstSeverity: Severity = 'Low';
    let openCount = 0;

    for (const inc of locationIncidents) {
      categories[inc.category] = (categories[inc.category] || 0) + 1;

      if (inc.status !== 'Fixed') {
        openCount++;
        if (SEVERITY_ORDER[inc.severity] > SEVERITY_ORDER[worstSeverity]) {
          worstSeverity = inc.severity;
        }
      }
    }

    // Find top category
    let topCategory = 'Other';
    let topCount = 0;
    for (const [cat, count] of Object.entries(categories)) {
      if (count > topCount) {
        topCategory = cat;
        topCount = count;
      }
    }

    result.push({
      location,
      total_incidents: locationIncidents.length,
      open_incidents: openCount,
      worst_severity: worstSeverity,
      top_category: topCategory,
      categories,
    });
  }

  // Sort by open incidents descending
  return result.sort((a, b) => b.open_incidents - a.open_incidents);
}
