// ============================================================
// CampusPulse — Duplicate Detection
//
// Finds incidents that are probably reporting the same
// underlying problem. Uses category + location + time window.
//
// For the hackathon demo, this is WOW MOMENT #2.
// ============================================================

import { supabase } from './supabase';
import type { Incident } from '../types/incident';

// ---------- Configuration ----------

/** Only look for duplicates within this time window */
const DUPLICATE_WINDOW_DAYS = 7;

// ---------- Find Similar Incidents ----------

/**
 * Find existing incidents that may be duplicates of a new report.
 *
 * Algorithm (simple, reliable, fast):
 * 1. Same category
 * 2. Same location
 * 3. Within the last 7 days
 * 4. Not already 'Fixed'
 *
 * This is deliberately simple. For a hackathon, this catches
 * the cases that matter (e.g., 4 water leak reports in Block B).
 */
export async function findSimilarIncidents(
  category: string,
  location: string,
): Promise<Incident[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DUPLICATE_WINDOW_DAYS);

  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('category', category)
    .eq('location', location)
    .neq('status', 'Fixed')
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Duplicates] Error finding similar incidents:', error);
    return [];
  }

  return (data as Incident[]) || [];
}

// ---------- Merge Incidents ----------

/**
 * Link a new incident to a set of related incidents.
 * Also increments report_count on the oldest (primary) incident.
 *
 * The "merge" in the UI doesn't delete incidents — it creates
 * relations and updates the primary incident's report_count.
 */
export async function mergeIncidents(
  newIncidentId: string,
  relatedIncidentIds: string[],
): Promise<boolean> {
  if (relatedIncidentIds.length === 0) return true;

  try {
    // 1. Create relation records
    const relations = relatedIncidentIds.map((relatedId) => ({
      incident_id: newIncidentId,
      related_incident_id: relatedId,
      similarity: 0.85, // Fixed score for category+location match
    }));

    const { error: relationError } = await supabase
      .from('incident_relations')
      .insert(relations);

    if (relationError) {
      console.error('[Duplicates] Error creating relations:', relationError);
      return false;
    }

    // 2. Find the primary incident (oldest one in the group)
    const allIds = [newIncidentId, ...relatedIncidentIds];
    const { data: allIncidents, error: fetchError } = await supabase
      .from('incidents')
      .select('id, created_at, report_count')
      .in('id', allIds)
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError || !allIncidents || allIncidents.length === 0) {
      console.error('[Duplicates] Error finding primary incident:', fetchError);
      return false;
    }

    const primaryId = allIncidents[0].id;
    const totalReports = allIds.length;

    // 3. Update the primary incident's report_count
    const { error: updateError } = await supabase
      .from('incidents')
      .update({ report_count: totalReports })
      .eq('id', primaryId);

    if (updateError) {
      console.error('[Duplicates] Error updating report count:', updateError);
      return false;
    }

    // 4. Log the merge activity
    await supabase.from('activity_logs').insert({
      incident_id: primaryId,
      action: 'Incidents Merged',
      details: `${totalReports} related reports consolidated into this incident`,
      actor: 'System',
    });

    return true;
  } catch (error) {
    console.error('[Duplicates] Merge failed:', error);
    return false;
  }
}

// ---------- Get Related Incidents ----------

/**
 * Get all incidents related to a given incident ID.
 * Looks in both directions of the relation.
 */
export async function getRelatedIncidents(
  incidentId: string,
): Promise<Incident[]> {
  // Find relation IDs in both directions
  const { data: relations, error: relError } = await supabase
    .from('incident_relations')
    .select('incident_id, related_incident_id')
    .or(`incident_id.eq.${incidentId},related_incident_id.eq.${incidentId}`);

  if (relError || !relations || relations.length === 0) {
    return [];
  }

  // Collect all related IDs (excluding the query incident itself)
  const relatedIds = new Set<string>();
  for (const rel of relations) {
    if (rel.incident_id !== incidentId) relatedIds.add(rel.incident_id);
    if (rel.related_incident_id !== incidentId) relatedIds.add(rel.related_incident_id);
  }

  if (relatedIds.size === 0) return [];

  // Fetch the full incident records
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .in('id', Array.from(relatedIds))
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Duplicates] Error fetching related incidents:', error);
    return [];
  }

  return (data as Incident[]) || [];
}
